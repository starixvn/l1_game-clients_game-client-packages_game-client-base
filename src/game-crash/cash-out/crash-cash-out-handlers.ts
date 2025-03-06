import { inject, injectable } from "inversify";
import { reaction } from "mobx";

import { BetStore } from "../../game/bets/bet-store";
import { ConnectionHandlers } from "../../game/connection/connection-handlers";
import { GameConfigStore } from "../../game/game-configs";
import { RoundHistoryStore } from "../../game/round-histories/round-history-store";
import { RoundTimeStore } from "../../game/rounds";
import { GameServiceMessage, IMultipleHandlers } from "../../shared";
import { BetInputStore } from "../bet-input/bet-input-store";
import { ButtonState, GameCrashServiceMessage } from "../game-crash-messages";
import { MultiplierStore } from "../multiplier/multiplier-store";
import { PlayerActionHandlers, PlayerActionStore } from "../player-actions";
import { CrashCashOutStore } from "./crash-cash-out-store";

@injectable()
export class CrashCashOutHandlers implements IMultipleHandlers {
    private readonly halfCashOutRatio = 0.5;
    private readonly fullCashOutRatio = 1;

    protected readonly displayCashedOutDuration = 2700;

    constructor(
        @inject(CrashCashOutStore) protected readonly cashOutStore: CrashCashOutStore,
        @inject(RoundHistoryStore) protected readonly roundHistoryStore: RoundHistoryStore,
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore,
        @inject(BetStore) protected readonly betStore: BetStore,
        @inject(MultiplierStore) private readonly multiplierStore: MultiplierStore,
        @inject(PlayerActionStore) protected readonly playerActionStore: PlayerActionStore,
        @inject(PlayerActionHandlers) protected readonly playerActionHandlers: PlayerActionHandlers,
        @inject(GameConfigStore) protected readonly gameConfigStore: GameConfigStore,
        @inject(BetInputStore) protected readonly betInputStore: BetInputStore,
        @inject(ConnectionHandlers.RetryGameHandler) protected readonly retryGameHandler: ConnectionHandlers.RetryGameHandler
    ) {
        reaction(
            () => this.roundTimeStore.isStartRound,
            (isStartRound) => {
                if (isStartRound) {
                    this.resetCashOut();
                }
            }
        );

        reaction(
            () => this.multiplierStore.multiplier,
            () => {
                this.handleMultiplier();
            }
        );
    }

    protected handleMultiplier() {
        const winAmount = this.calculateWinAmount();

        if (winAmount <= 0) {
            return;
        }

        this.updateFullCashOutValue(winAmount);
        if (!this.cashOutStore.isFullCashedOut) {
            this.updateHalfCashOutValueByRatio(winAmount);
        }
    }

    private calculateWinAmount() {
        const { multiplier } = this.multiplierStore;
        const betAmount = this.betInputStore.betAmountRatio;
        return multiplier > 0 ? betAmount * multiplier : 0;
    }

    private updateFullCashOutValue(winAmount: number) {
        if (this.cashOutStore.isFullCashedOut) {
            return;
        }

        this.setFullCashedOutValue(winAmount);
    }

    private updateHalfCashOutValueByRatio(winAmount: number) {
        if (this.cashOutStore.isHalfCashedOut) {
            return;
        }

        this.setHalfCashedOutValue(winAmount * this.halfCashOutRatio);
    }

    protected handleCashOutHalf(cashOut: GameCrashServiceMessage.CrashCashOut | undefined) {
        this.retryGameHandler.clearInterval();
        this.handleHalfCashOutMessage(cashOut);
        this.cashOutStore.setCashOutNotice(cashOut);
    }

    private handleHalfCashOutMessage(halfCashOut: GameCrashServiceMessage.CrashCashOut | undefined) {
        this.cashOutStore.halfCashOut = halfCashOut;
        this.setHalfCashedOutValue(halfCashOut.cashOutWin);

        this.cashOutStore.ratio = this.halfCashOutRatio;
    }

    protected handleCashOutFull(cashOut: GameCrashServiceMessage.CrashCashOut | undefined) {
        this.retryGameHandler.clearInterval();
        this.handleCashOutMessage(cashOut);
        this.cashOutStore.setCashOutNotice(cashOut);

        setTimeout(() => {
            this.hideCashOut();
        }, this.displayCashedOutDuration);
    }

    protected handleCashOutMessage(cashOut: GameCrashServiceMessage.CrashCashOut | undefined) {
        this.cashOutStore.cashOut = cashOut;
        this.setFullCashedOutValue(cashOut.cashOutWin);
        this.updateHalfCashOutValueByRatio(cashOut.cashOutWin);
    }

    private setHalfCashedOutValue(value: number) {
        this.cashOutStore.halfCashOutValue = value;
    }

    private setFullCashedOutValue(value: number) {
        this.cashOutStore.fullCashOutValue = value;
    }

    private hideCashOut() {
        this.cashOutStore.ratio = this.fullCashOutRatio;

        this.playerActionHandlers.changeButtonBetNextRound();
    }

    protected handleOwnBets(ownBets: GameCrashServiceMessage.CrashOwnBets) {
        if (!ownBets) {
            return;
        }

        this.betStore.lastReceivedBet = { value: ownBets.amount, isAnimated: false };

        //set state to CASH OUT for join game at flying time
        this.playerActionStore.buttonState = ButtonState.CASH_OUT;

        if (ownBets.halfCashOut) {
            this.handleHalfCashOutMessage(ownBets.halfCashOut);
        }

        if (ownBets.cashOut) {
            this.handleCashOutMessage(ownBets.cashOut);
            this.cashOutStore.ratio = this.fullCashOutRatio;
            this.playerActionStore.buttonState = ButtonState.BET_NEXT_ROUND;
            return;
        }

        this.callHandleCrashed();
    }

    callHandleCrashed() {
        if (this.roundTimeStore.initialized && this.gameConfigStore.initialized) {
            this.handleCrashed();
        } else {
            setTimeout(() => this.callHandleCrashed(), 50);
        }
    }

    private handleCrashed() {
        if (!this.roundTimeStore.isDisplayingResultState) {
            return;
        }

        this.multiplierStore.multiplier = +(this.roundHistoryStore.getLastRound()?.result || 0);

        if (this.multiplierStore.multiplier) {
            this.setFullCashedOutValue(this.calculateWinAmount());
            this.updateHalfCashOutValueByRatio(this.calculateWinAmount());
        }
    }

    protected resetCashOut() {
        this.cashOutStore.fullCashOutValue = 0;
        this.cashOutStore.halfCashOutValue = 0;

        this.cashOutStore.cashOut = null;
        this.cashOutStore.halfCashOut = null;

        this.cashOutStore.ratio = this.fullCashOutRatio;
    }

    eventHandleList = [
        {
            name: GameCrashServiceMessage.CrashCashOut.cashOutEventName,
            handle: this.handleCashOutFull,
        },
        {
            name: GameCrashServiceMessage.CrashCashOut.halfCashOutEventName,
            handle: this.handleCashOutHalf,
        },
        {
            name: GameServiceMessage.OwnBets.eventName,
            handle: this.handleOwnBets,
        },
    ];
}
