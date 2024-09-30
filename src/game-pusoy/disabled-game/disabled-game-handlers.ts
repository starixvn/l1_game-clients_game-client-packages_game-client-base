import { inject, injectable } from "inversify";
import { AppHandlers } from "../../app/app-handlers";
import { AuthStore } from "../../auth";
import { ConnectionStore } from "../../game/connection";
import { DisabledGameStore } from "../../game/disabled-game";
import { NoticeInfo, NoticeStore, NoticeType } from "../../game/notices";
import { GameServiceMessage, IHandler } from "../../shared";
import { DefaultLanguage, SupportedLanguages } from "../../shared/languages";
import { Translator } from "../../shared/utils/localization-manager";
import { RoundTimeHandlers, RoundTimeStore, TimelineKey } from "../rounds";
import { AppTypes } from "./../../shared/constants/app-type";
import { reaction } from "mobx";

@injectable()
export class DisableGameHandlers implements IHandler<GameServiceMessage.DisabledGameInfo> {
    name = GameServiceMessage.DisabledGameInfo.eventName;
    constructor(
        @inject(ConnectionStore) protected readonly connectionStore: ConnectionStore,
        @inject(AuthStore) protected readonly authStore: AuthStore,
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore,
        @inject(DisabledGameStore) protected readonly disabledGameStore: DisabledGameStore,
        @inject(NoticeStore) protected readonly noticeStore: NoticeStore,
        @inject(AppHandlers.BackToOperatorLobby) protected readonly backToOperatorLobby: AppHandlers.BackToOperatorLobby,
        @inject(RoundTimeHandlers) protected readonly roundTimeHandlers: RoundTimeHandlers
    ) {
        this.onClosedHandle = this.onClosedHandle.bind(this);

        reaction(
            () => this.connectionStore.isConnectFailed,
            (isConnectFailed) => isConnectFailed && this.handleConnectFailedOrDisConnect()
        );
        reaction(
            () => this.connectionStore.isDisconnect,
            (isDisconnect) => isDisconnect && this.handleConnectFailedOrDisConnect()
        );
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

    inGameHandle() {
        this.disabledGameStore.setGameStatus(true);
    }

    joinGameHandle(disabledGameInfo: GameServiceMessage.DisabledGameInfo) {
        if (!this.disabledGameStore.showPopup) {
            this.showPopupHandle(disabledGameInfo);
            this.roundTimeStore.stop();
        }
    }

    handle(disabledGameInfo: GameServiceMessage.DisabledGameInfo) {
        this.roundTimeStore.in(TimelineKey.arrangement) || this.roundTimeStore.in(TimelineKey.animation)
            ? this.inGameHandle()
            : this.joinGameHandle(disabledGameInfo);
    }

    handleConnectFailedOrDisConnect() {
        this.roundTimeStore.stop();
    }
}
