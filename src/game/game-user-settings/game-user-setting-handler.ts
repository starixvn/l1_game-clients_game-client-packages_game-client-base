import { inject, injectable } from "inversify";
import { reaction } from "mobx";
import { AppStore } from "../../app/app-store";
import { GameUserSettingAction, GameUserSettingStore } from "./game-user-setting-store";
@injectable()
export class GameUserSettingHandler {
    constructor(
        @inject(GameUserSettingStore) private readonly userGameSettingStore: GameUserSettingStore,
        @inject(AppStore) protected readonly appStore: AppStore
    ) {
        reaction(
            () => this.appStore.isClearStorage,
            (isClearStorage) => {
                isClearStorage && this.clearTempStorage();
            }
        );
    }

    savePermanentStorage() {
        this.userGameSettingStore.permanentStorage = { action: GameUserSettingAction.Save };
    }

    loadTempStorage() {
        this.userGameSettingStore.tempStorage = { action: GameUserSettingAction.Load };
    }

    saveTempStorage() {
        this.userGameSettingStore.tempStorage = { action: GameUserSettingAction.Save };
    }

    clearTempStorage() {
        this.userGameSettingStore.tempStorage = { action: GameUserSettingAction.Clear };
    }
}
