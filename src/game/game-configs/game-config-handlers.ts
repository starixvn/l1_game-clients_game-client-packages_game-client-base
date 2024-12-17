import { inject, injectable } from "inversify";
import { AppStore } from "../../app/app-store";
import { GameServiceMessage, IMultipleHandlers } from "../../shared";
import { DisabledGameStore } from "../disabled-game/disabled-game-store";
import { NoticeStore } from "../notices/notice-store";
import { GameConfigStore } from "./game-config-store";

@injectable()
export class GameConfigHandlers implements IMultipleHandlers {
    constructor(
        @inject(GameConfigStore) protected readonly gameConfigStore: GameConfigStore,
        @inject(AppStore) protected readonly appStore: AppStore,
        @inject(NoticeStore) protected readonly noticeStore: NoticeStore,
        @inject(DisabledGameStore) protected readonly disabledGameStore: DisabledGameStore
    ) {}

    handleGameConfigs(gameConfigs: GameServiceMessage.GameConfigs) {
        if (this.disabledGameStore.disabled && this.gameConfigStore.initialized) {      
            this.disabledGameStore.setNoticeDisable(null);
            this.disabledGameStore.setGameStatus(false);
        }
        this.gameConfigStore.setGameConfigs(gameConfigs);
        this.appStore.isLoading = false;
        this.noticeStore.hideNotice();
    
    }

    eventHandleList = [
        {
            name: GameServiceMessage.GameConfigs.eventName,
            handle: this.handleGameConfigs,
        },
    ];
}
