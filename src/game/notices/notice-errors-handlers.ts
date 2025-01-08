import { inject, injectable } from "inversify";
import { reaction } from "mobx";
import { AppHandlers, AppStore } from "../../app";
import { AuthHandlers, AuthStore } from "../../auth";
import { ErrorUtils } from "../../shared/utils";
import { Translator } from "../../shared/utils/localization-manager";
import { ConnectionStore } from "../connection/connection-store";
import { GameSetting } from "../game-configs";
import { AppTypes } from "./../../shared/constants/app-type";
import { NoticeInfo, NoticeStore, NoticeType } from "./notice-store";

export namespace NoticeErrorsHandlers {
    @injectable()
    export class AutoSignOutHandler {
        constructor(
            @inject(AppStore)
            protected readonly appStore: AppStore,
            @inject(NoticeStore)
            protected readonly noticeStore: NoticeStore,
            @inject(AuthStore)
            protected readonly authStore: AuthStore,
            @inject(AuthHandlers.SignOut)
            protected readonly signOutHandler: AuthHandlers.SignOut,
            @inject(ConnectionStore)
            protected readonly connectionStore: ConnectionStore,
            @inject(AuthHandlers.ClearRecheckInInterval)
            protected readonly clearRecheckInInterval: AuthHandlers.ClearRecheckInInterval
        ) {
            reaction(() => this.authStore.errorCode, this.onErrorCodeChange.bind(this));
        }

        onErrorCodeChange(errorCode: string) {
            if (this.authStore.isDisabledAccount) {
                this.showDisabledAccountNotice(errorCode);
            } else {
                if (ErrorUtils.isSessionTimeoutError(errorCode)) {
                    this.showSessionNotice(errorCode);
                } else {
                    this.showErrorNotice(errorCode);
                }
            }
        }

        showErrorNotice(errorCode: string) {
            const key = ErrorUtils.parseErrorCode(errorCode);
            const message = Translator.translate(key, { errorCode });
            this.noticeStore.addNotice({
                message,
                title: Translator.commonTranslate("notice"),
                type: NoticeType.Error,
                onClose: null,
                showBtnConfirmButton: true,
                noticeInfo: NoticeInfo.ApiError,
            });
        }

        showDisabledAccountNotice(errorCode: string) {
            const text = Translator.getMessageFollowSystem(this.authStore.system, "message_close_account", { errorCode });
            this.showErrorNoticeAndSignOut(text, NoticeInfo.DisabledAccount);
        }

        showSessionNotice(errorCode: string) {
            const key = this.appStore.isApp ? "message_session_expired" : "message_session_timeout";
            const text = Translator.getMessageFollowSystem(this.authStore.system, key);
            this.showErrorNoticeAndSignOut(`${text} (${errorCode})`, NoticeInfo.SessionTimeout);
        }

        showErrorNoticeAndSignOut(message = "", noticeInfo?: NoticeInfo) {
            const signOut = () => {
                this.signOutHandler.handle();
                this.connectionStore.closeSocket();
            };
            setTimeout(signOut, 10000);
            this.clearRecheckInInterval.handle();
            this.noticeStore.addNotice({
                message,
                title: Translator.commonTranslate("notice"),
                type: NoticeType.Error,
                onClose: signOut,
                showBtnConfirmButton: true,
                noticeInfo: noticeInfo,
            });
        }
    }

    @injectable()
    export class BackToOperatorLobbyHandler {
        constructor(
            @inject(GameSetting)
            protected readonly gameSetting: GameSetting,
            @inject(ConnectionStore)
            protected readonly connectionStore: ConnectionStore,
            @inject(NoticeStore)
            protected readonly noticeStore: NoticeStore,
            @inject(AppHandlers.BackToOperatorLobby)
            protected readonly backToOperatorLobbyHandler: AppHandlers.BackToOperatorLobby,
            @inject(AuthStore)
            protected readonly authStore: AuthStore
        ) {
            reaction(
                () => this.connectionStore.isConnectFailed,
                (isConnectFailed) => isConnectFailed && !this.isInstantApp() && this.showNotice()
            );

            reaction(
                () => this.connectionStore.isDisconnect,
                (isDisconnect) => isDisconnect && this.handleDisConnect()
            );

            reaction(
                () => ({
                    isConnectFailed: this.connectionStore.isConnectFailed,
                    isDisconnect: this.connectionStore.isDisconnect,
                }),
                ({ isConnectFailed, isDisconnect }) => {
                    if (this.isMobileDirect() && (isConnectFailed || isDisconnect)) {
                        this.showMobileDirectNotice();
                    }
                }
            );
        }

        isInstantApp() {
            return this.authStore.system === AppTypes.Instant;
        }

        isMobileDirect() {
            return this.authStore.system === AppTypes.MobileDirect;
        }

        showNotice() {
            const gameName = Translator.gameTranslate("game_name");
            const message = Translator.getMessageFollowSystem(this.authStore.system, "message_lost_game_connection", { gameName });
            const backToLobby = () => {
                this.backToOperatorLobbyHandler.handle();
            };
            this.noticeStore.addNotice({
                message,
                title: Translator.commonTranslate("notice"),
                type: NoticeType.Error,
                onClose: backToLobby,
                noticeInfo: NoticeInfo.LostGameConnection,
            });
        }

        handleDisConnect() {
            this.backToOperatorLobbyHandler.handle();
        }

        showMobileDirectNotice() {
            const gameName = Translator.gameTranslate("game_name");
            const message = Translator.getMessageFollowSystem(this.authStore.system, "message_lost_game_connection", { gameName });
            const reConnect = () => {
                this.connectionStore.initConnection();
            };
            this.noticeStore.addNotice({
                message,
                title: Translator.commonTranslate("notice"),
                type: NoticeType.Error,
                onClose: reConnect,
                noticeInfo: NoticeInfo.LostGameConnection,
            });
        }
    }
}
