import { inject, injectable } from "inversify";
import { makeAutoObservable } from "mobx";

import { MainPlayerStore } from "../../players";
import { GameServiceMessage } from "../../shared";
import { GameConfigStore } from "../game-configs";
import { RoundHistoryStore } from "../round-histories";
import { SettlementStore } from "../settlements";
import { ROUND_STATE, RoundTimeStore } from "./round-time-store";

export type Bets = {
    [betChoice: string]: number;
};

export type RoundOdds = {
    odds: GameServiceMessage.Odds;
    fractional: boolean;
};

export interface THighlightAnim {
    isAnim: boolean;
    settlementResult: GameServiceMessage.TSettlementResult;
}

export interface THighlightStatic {
    settlementResult: GameServiceMessage.TSettlementResult;
    result: GameServiceMessage.TResult;
}

@injectable()
export class RoundStore {
    constructor(
        @inject(GameConfigStore) protected readonly gameConfigStore: GameConfigStore,
        @inject(RoundHistoryStore) protected readonly roundHistoryStore: RoundHistoryStore,
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore,
        @inject(MainPlayerStore) protected readonly mainPlayerStore: MainPlayerStore,
        @inject(SettlementStore) protected readonly settlementStore: SettlementStore
    ) {
        makeAutoObservable(this, {
            _clientRoundId: false,
        });
    }

    roundId = 0;
    private _ownBets: GameServiceMessage.OwnBets = {};
    private _totalBets: GameServiceMessage.TotalBets = {};
    resultHash: GameServiceMessage.ResultHash = null;
    private _userBetPercentage: GameServiceMessage.UserBetPercentage = null;
    private _betPercentage: GameServiceMessage.UserBetPercentage = {};

    _clientRoundId = 0;

    set clientRoundId(roundId: number) {
        this._clientRoundId = roundId;
    }

    get clientRoundId() {
        const currentFinish = this.settlementStore.currentFinish;
        if (!currentFinish || this.historyRoundId >= currentFinish.roundId) {
            return this.historyRoundId;
        }
        return currentFinish.roundId;
    }

    get historyRoundId() {
        let lastRoundId = 0;

        if (this.roundHistoryStore.histories.length > 0) {
            lastRoundId = this.roundHistoryStore.histories[0].roundId;
        }

        const isTime0BeforeFinish = this.roundTimeStore.roundTime === 0 && !this.settlementStore.currentFinish;
        if (
            this.roundTimeStore.roundState === ROUND_STATE.STARTING_ROUND ||
            this.roundTimeStore.roundState === ROUND_STATE.PLACING_BET ||
            this.roundTimeStore.roundState === ROUND_STATE.LOCKING_BET ||
            this.roundTimeStore.roundState === ROUND_STATE.WAITING ||
            isTime0BeforeFinish
        ) {
            lastRoundId++;
        }

        // when clearing all active data in database and having data in archive collection
        if (this.roundHistoryStore.histories.length === 0 && this.roundId > 0) {
            lastRoundId = this.roundId;
        }

        if (this._clientRoundId < lastRoundId) {
            this.clientRoundId = lastRoundId;
        }
        return this._clientRoundId;
    }

    get minBet() {
        return Math.max(this.gameConfigStore.minBet, this.mainPlayerStore.stakeLevel.minBet);
    }

    get maxBet() {
        return Math.min(this.gameConfigStore.maxBet, this.mainPlayerStore.stakeLevel.maxBet);
    }

    get roundOdds() {
        return {
            odds: this.gameConfigStore.odds,
            fractional: this.mainPlayerStore.fractionalOddsFormat,
        };
    }

    set totalBets(totalBets: GameServiceMessage.TotalBets) {
        this._totalBets = totalBets;
    }

    get totalBets() {
        return Object.keys(this._totalBets).reduce((total, betChoice) => {
            total[betChoice] = this._totalBets[betChoice] / this.mainPlayerStore.rate;
            return total;
        }, {});
    }

    get ownBets() {
        return this._ownBets;
    }

    set ownBets(ownBets: GameServiceMessage.OwnBets) {
        this._ownBets = ownBets;
    }

    set userBetPercentage(betPercent: GameServiceMessage.UserBetPercentage) {
        this._userBetPercentage = betPercent;
    }

    get userBetPercentage() {
        return this._userBetPercentage;
    }

    set betPercentage(betPercent: GameServiceMessage.BetPercentage) {
        this._betPercentage = betPercent;
    }

    get betPercentage() {
        return this._betPercentage;
    }

    get isResetHighlight(): boolean {
        let isResetHighlight = false;

        switch (this.roundTimeStore.roundState) {
            case ROUND_STATE.LOCKING_BET:
            case ROUND_STATE.STOP_GAME_LOOP:
            case ROUND_STATE.SHOW_ANIMATION_RESULT:
                isResetHighlight = true;
                break;
        }

        return isResetHighlight;
    }

    get highLightAnim(): THighlightAnim {
        const isAnim = this.settlementStore.isFinishedShowResult;
        const settlementResult = this.roundHistoryStore?.getLastRound()?.settlementResult;

        return {
            isAnim,
            settlementResult,
        };
    }

    get highlightStatic(): THighlightStatic {
        let settlementResult: GameServiceMessage.TSettlementResult = null;
        let result: GameServiceMessage.TResult = null;
        if (this.roundTimeStore.isPlacingBet || this.roundTimeStore.isStartingRound) {
            const lastRound = this.roundHistoryStore?.getLastRound();
            settlementResult = lastRound?.settlementResult;
            result = lastRound?.result;
        }

        return { settlementResult, result };
    }

    resetForNewRound() {
        this.ownBets = {};
        this._totalBets = {};
        this._userBetPercentage = null;
        this._betPercentage = {};
    }

    resetRoundStore() {
        this.resetForNewRound();
        this.resultHash = null;
    }
}
