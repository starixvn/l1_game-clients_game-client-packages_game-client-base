import { inject, injectable } from "inversify";
import { RoundStore, RoundTimeStore } from "../rounds";
import { MainPlayerStore } from "../../players";
import { action, computed, makeAutoObservable } from "mobx";

@injectable()
export class ArrangementStore {
    private _mainPlayerSubmitted: boolean = false;

    constructor(
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore,
        @inject(RoundStore) protected readonly roundStore: RoundStore,
        @inject(MainPlayerStore) private readonly playerStore: MainPlayerStore
    ) {
        makeAutoObservable(this);
    }

    get isShowArrangement(): boolean {
        return !this.mainPlayerSubmitted && this.roundTimeStore.isInArrangementTime;
    }

    get mainPlayerSubmitted(): boolean {
        return this._mainPlayerSubmitted;
    }

    set mainPlayerSubmitted(value: boolean) {
        this._mainPlayerSubmitted = value;
    }
}
