import { inject, injectable } from "inversify";
import { GameServiceMessage, IMultipleHandlers } from "../../shared";
import { RoundTimeStore } from "./round-time-store";

@injectable()
export class RoundTimeHandlers implements IMultipleHandlers {
    constructor(@inject(RoundTimeStore) protected readonly store: RoundTimeStore) {}

    handleRemainingTime(remainingTime: number) {
        if (!this.store.running) {
            this.store.start();
        }

        this.store.pause();
        this.store.remaining = remainingTime;
        this.store.play();
    }

    handleAlreadyDealt() {
        this.store.startDeal = false;
    }

    handleRoundEnd() {
        this.store.pause();
    }

    eventHandleList = [
        {
            name: GameServiceMessage.remainingTime,
            handle: this.handleRemainingTime,
        },
    ];
}
