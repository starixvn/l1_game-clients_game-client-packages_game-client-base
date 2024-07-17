import { inject, injectable } from "inversify";
import { RoundTimeStore } from "./round-time-store";

@injectable()
export class RoundRunningHandlers {
    runnerId;

    constructor(@inject(RoundTimeStore) protected readonly store: RoundTimeStore) {}

    startRunner() {
        this.store.start();
    }

    stopRunner() {
        this.store.stop();
    }
}
