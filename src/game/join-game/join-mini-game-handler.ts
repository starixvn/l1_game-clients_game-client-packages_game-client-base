import { GameServiceMessage, IMultipleHandlers } from "../../shared";
import { JoinGameStore } from "./join-game-store";
import { injectable, inject } from "inversify";

@injectable()
export class JoinMiniGameHandlers implements IMultipleHandlers {
    constructor(@inject(JoinGameStore) protected readonly joinGameStore: JoinGameStore) {}

    handle() {
        this.joinGameStore.signedIn = true;
    }
    eventHandleList = [
        {
            name: GameServiceMessage.signedIn,
            handle: this.handle,
        },
    ];
}
