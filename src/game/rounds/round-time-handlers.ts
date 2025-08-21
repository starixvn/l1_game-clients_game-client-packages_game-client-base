import { inject, injectable } from "inversify";
import { GameServiceMessage, IMultipleHandlers } from "../../shared";
import { DisabledGameStore } from "../disabled-game/disabled-game-store";
import { RoundRunningHandlers } from "./round-running-handlers";
import { RoundTimeStore } from "./round-time-store";

@injectable()
export class RoundTimeHandlers implements IMultipleHandlers {
    constructor(
        @inject(RoundTimeStore) protected readonly store: RoundTimeStore,
        @inject(RoundRunningHandlers) protected readonly roundRunningHandlers: RoundRunningHandlers,
        @inject(DisabledGameStore) protected readonly disabledGameStore: DisabledGameStore
    ) {}

    handleRemainingTime(remainingTime: number) {
        this.roundRunningHandlers.stopRunner();
        this.store.roundTime = remainingTime;
        if (!this.disabledGameStore.disabled) {
            this.roundRunningHandlers.startRunner();
        }
    }

    handleStartNewRoundStatus(snr: boolean) {
        this.store.startNewRound = snr;
    }

    handleStartPlacingBetStatus(spb: boolean) {
        this.store.startPlacingBet = spb;
    }

    handleEndPlacingBetStatus(epb: boolean) {
        this.store.endPlacingBet = epb;
    }

    handleEndRoundStatus(finish: GameServiceMessage.Finish | undefined) {
        if (finish) {
            this.store.endRound = true;
            this.store.endPlacingBet = false;
            this.store.startPlacingBet = false;
            this.store.startNewRound = false;
        }
    }

    eventHandleList = [
        {
            name: GameServiceMessage.remainingTime,
            handle: this.handleRemainingTime,
        },
        {
            name: GameServiceMessage.snr,
            handle: this.handleStartNewRoundStatus,
        },
        {
            name: GameServiceMessage.spb,
            handle: this.handleStartPlacingBetStatus,
        },
        {
            name: GameServiceMessage.epb,
            handle: this.handleEndPlacingBetStatus,
        },
        {
            name: GameServiceMessage.Finish.eventName,
            handle: this.handleEndRoundStatus,
        },
    ];
}
