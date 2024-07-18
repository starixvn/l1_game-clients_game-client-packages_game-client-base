import { inject, injectable } from "inversify";
import { ConnectionStore } from "../../game/connection";
import { GameUserSettingHandler } from "../../game/game-user-settings";
import { IHandler } from "../../shared/mediator";
import { RoundTimeStore } from "../rounds";

@injectable()
export class HideGameHandler implements IHandler<void> {
    constructor(
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore,
        @inject(ConnectionStore) protected readonly connectStore: ConnectionStore,
        @inject(GameUserSettingHandler) protected readonly gameUserSettingHandler: GameUserSettingHandler
    ) {}

    handle() {
        this.roundTimeStore.stop();
        this.connectStore.onDisconnected();
        this.gameUserSettingHandler.saveTempStorage();
    }
}
