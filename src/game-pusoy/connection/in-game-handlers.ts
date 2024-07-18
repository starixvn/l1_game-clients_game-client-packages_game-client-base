import { inject, injectable } from "inversify";
import { GameClientEmitMessage, IHandler } from "../../shared";
import { ConnectionStore } from "../../game/connection";

@injectable()
export class InGameHandler implements IHandler<void> {
    constructor(@inject(ConnectionStore) private readonly connectionStore: ConnectionStore) {}

    handle() {
        this.connectionStore.send(GameClientEmitMessage.inGame, null);
    }
}
