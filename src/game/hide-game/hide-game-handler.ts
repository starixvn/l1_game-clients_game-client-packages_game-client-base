import { inject, injectable } from "inversify";
import { IHandler } from "../../shared/mediator";
import { ConnectionStore } from "../connection/connection-store";
import { GameUserSettingHandler } from "../game-user-settings/game-user-setting-handler";
import { RoundRunningHandlers } from "../rounds/round-running-handlers";

@injectable()
export class HideGameHandler implements IHandler<void> {
    constructor(
        @inject(RoundRunningHandlers) protected readonly roundRunning: RoundRunningHandlers,
        @inject(ConnectionStore) protected readonly connectStore: ConnectionStore,
        @inject(GameUserSettingHandler) protected readonly gameUserSettingHandler: GameUserSettingHandler
    ) { }

    handle() {
        this.roundRunning.stopRunner();
        this.connectStore.disconnect();
        this.gameUserSettingHandler.saveTempStorage();
    }
}
