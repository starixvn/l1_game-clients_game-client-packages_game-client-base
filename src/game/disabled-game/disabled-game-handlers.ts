import { inject, injectable } from "inversify";
import { AppHandlers } from "../../app/app-handlers";
import { AuthStore } from "../../auth";
import { GameServiceMessage, IHandler, IMultipleHandlers } from "../../shared";
import { Translator } from "../../shared/utils/localization-manager";
import { ConnectionStore } from "../connection/connection-store";
import { NoticeInfo, NoticeStore, NoticeType } from "../notices";
import { RoundRunningHandlers } from "../rounds";
import { RoundTimeStore } from "../rounds/round-time-store";
import { AppTypes } from "./../../shared/constants/app-type";
import { DisabledGameStore } from "./disabled-game-store";
import { DefaultLanguage, SupportedLanguages } from "../../shared/languages";
import { SettlementStore } from "../settlements";

@injectable()
export class DisableGameHandlers implements IMultipleHandlers {
    name = GameServiceMessage.DisabledGameInfo.eventName;
    constructor(
        @inject(ConnectionStore) protected readonly connectionStore: ConnectionStore,
        @inject(AuthStore) protected readonly authStore: AuthStore,
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore,
        @inject(DisabledGameStore) protected readonly disabledGameStore: DisabledGameStore,
        @inject(NoticeStore) protected readonly noticeStore: NoticeStore,
        @inject(AppHandlers.BackToOperatorLobby) protected readonly backToOperatorLobby: AppHandlers.BackToOperatorLobby,
        @inject(RoundRunningHandlers) protected readonly roundRunningHandlers: RoundRunningHandlers,
        @inject(SettlementStore) private readonly settlementStore: SettlementStore
    ) {
        this.onClosedHandle = this.onClosedHandle.bind(this);
    }

    onClosedHandle() {
        if (!this.isInstantApp()) {
            this.connectionStore.onDisconnected();
            this.backToOperatorLobby.handle();
        }
    }

    isInstantApp() {
        return this.authStore.system === AppTypes.Instant;
    }

    showPopupHandle(disabledGameInfo: GameServiceMessage.DisabledGameInfo) {
        const language = SupportedLanguages.includes(this.authStore.language) ? this.authStore.language : DefaultLanguage;
        this.noticeStore.addNotice({
            message: disabledGameInfo[language],
            title: Translator.commonTranslate("notice"),
            type: NoticeType.Error,
            onClose: this.onClosedHandle,
            showBtnConfirmButton: true,
            noticeInfo: NoticeInfo.DisabledGame,
        });

        this.disabledGameStore.setShowPopup(true);
    }

    inGameHandle(disabledGameInfo: GameServiceMessage.DisabledGameInfo) {
        if (this.disabledGameStore.disabled) {
            if (!this.disabledGameStore.showPopup && this.roundTimeStore.isShowDisabledGameMessage && !this.settlementStore.currentFinish) {
                this.showPopupHandle(disabledGameInfo);
                this.roundRunningHandlers.stopRunner();
            }
        } else {
            this.disabledGameStore.setGameStatus(true);
            this.roundTimeStore.resetRoundTime();
        }
    }

    handleDisableGameInfo(disabledGameInfo: GameServiceMessage.DisabledGameInfo) {
        if (this.disabledGameStore.isUM) {
            this.inGameHandle(disabledGameInfo);
        }
    }

    handleUM(value: boolean) {
        this.disabledGameStore.isUM = value;
    }

    eventHandleList = [
        {
            name: GameServiceMessage.DisabledGameInfo.eventName,
            handle: this.handleDisableGameInfo,
        },
        {
            name: GameServiceMessage.um,
            handle: this.handleUM,
        },
    ];
}
