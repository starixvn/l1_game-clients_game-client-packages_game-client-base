import { inject, injectable } from "inversify";
import { AppHandlers } from "../../app/app-handlers";
import { AuthStore } from "../../auth";
import { GameServiceMessage, IMultipleHandlers } from "../../shared";
import { DefaultLanguage, SupportedLanguages } from "../../shared/languages";
import { Translator } from "../../shared/utils/localization-manager";
import { ConnectionStore } from "../connection/connection-store";
import { NoticeInfo, NoticeStore, NoticeType } from "../notices";
import { RoundRunningHandlers } from "../rounds";
import { RoundTimeStore } from "../rounds/round-time-store";
import { SettlementStore } from "../settlements/settlement-store";
import { AppTypes } from "./../../shared/constants/app-type";
import { DisabledGameStore } from "./disabled-game-store";

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

    showPopupHandle() {
        const language = SupportedLanguages.includes(this.authStore.language) ? this.authStore.language : DefaultLanguage;
        this.disabledGameStore.setNoticeDisable({
            message: this.disabledGameStore.disableGameInfo[language],
            title: Translator.commonTranslate("notice"),
            type: NoticeType.Error,
            onClose: this.onClosedHandle,
            showBtnConfirmButton: true,
            noticeInfo: NoticeInfo.DisabledGame,
        });
    }

    inGameHandle() {
        if (this.roundTimeStore.isShowDisabledGameMessage && !this.settlementStore.currentFinish) {
            setTimeout(() => {
                this.showPopupHandle();
            }, 0);
            this.roundRunningHandlers.stopRunner();
        }
    }

    handleDisableGameInfo(disabledGameInfo: GameServiceMessage.DisabledGameInfo) {
        this.disabledGameStore.setDisableGameInfo(disabledGameInfo);
    }

    handleUM(um: boolean) {
        this.disabledGameStore.disabled = um;
        if (um) {
            if (this.settlementStore.currentFinish && !this.disabledGameStore.isResetRoundTime) {
                this.roundTimeStore.resetRoundTime();
                this.disabledGameStore.isResetRoundTime = true;
            }
            this.inGameHandle();
        }
    }

    eventHandleList = [
        {
            name: GameServiceMessage.um,
            handle: this.handleUM,
        },
        {
            name: GameServiceMessage.DisabledGameInfo.eventName,
            handle: this.handleDisableGameInfo,
        },
    ];
}
