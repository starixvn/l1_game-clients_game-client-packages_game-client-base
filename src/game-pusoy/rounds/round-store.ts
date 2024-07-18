import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";

@injectable()
export class RoundStore {
    constructor() {
        makeAutoObservable(this);
    }

    roundId = 0;
}
