import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";

@injectable()
export class BetDetailsStore {
    constructor() {
        makeAutoObservable(this);
    }

    betDetailsUrl = "";
}
