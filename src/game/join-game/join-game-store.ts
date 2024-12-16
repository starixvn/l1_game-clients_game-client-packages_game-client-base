import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";

@injectable()
export class JoinGameStore {
    constructor() {
        makeAutoObservable(this);
    }

    toGame = {};

    signedIn = false;
}
