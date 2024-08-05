import { inject, injectable } from "inversify";
import { RoundStore, RoundTimeStore } from "../rounds";
import { MainPlayerStore } from "../../players";

@injectable()
export class ArrangementStore {
    constructor(
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore,
        @inject(RoundStore) protected readonly roundStore: RoundStore,
        @inject(MainPlayerStore) private readonly playerStore: MainPlayerStore
    ) {}

    get isShowArrangement(): boolean {
        const mainPlayerSubmitted = this.roundStore.submittedPlayers.filter((p) => p.name === this.playerStore.name).length > 0;
        return mainPlayerSubmitted && this.roundTimeStore.isInArrangementTime;
    }
}
