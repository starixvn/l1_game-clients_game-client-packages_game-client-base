import { inject, injectable } from "inversify";
import { ReCheckInResponse, UMInfo } from "sc-user-service-client/dist/auth";
import { NoticeInfo, NoticeStore, NoticeType } from "../game/notices/notice-store";
import { PlayerSelectionHandlers } from "../game/player-selections";
import { UserSettingData } from "../game/user-settings/user-setting-store";
import { NotificationHandlers } from "../notification/notification-handlers";
import { MainPlayerStore } from "../players";
import { GameServiceMessage, IHandler, utils } from "../shared";
import { AppTypes } from "../shared/constants/app-type";
import { BrowserDomUtils } from "../shared/utils/browser-dom-utils";
import { GameUtils } from "../shared/utils/game-utils";
import { Translator } from "../shared/utils/localization-manager";
import { sentryLogger } from "../shared/utils/logger";
import { NameGenerator } from "../shared/utils/name-generator";
import { StorageManager, localStorageKeys } from "../shared/utils/storage-manager";
import { AppStore } from "./../app/app-store";
import { URLParams } from "./../shared/constants/url-params";
import { AuthStore, ISessionInfo } from "./auth-store";
import { UserService } from "./user-service";

const { ErrorUtils } = utils;

interface IAuthorizeResponse {
    errorCode?: string;
    message?: string;
    isSuccessful?: boolean;
    isUM?: boolean;
    umInfo?: UMInfo;
    authorized?: boolean;
    user?: GameServiceMessage.User;
}

export namespace AuthHandlers {
    @injectable()
    export class SignOut implements IHandler<void> {
        constructor(@inject(AppStore) private readonly appStore: AppStore, @inject(AuthStore) private readonly authStore: AuthStore) {}
        handle() {
            this.authStore.signOut();
            this.appStore.setTimeOut();
        }
    }
    @injectable()
    export class Authorize implements IHandler<{ session?: string; username?: string }> {
        private session = "";
        private username = "";
        constructor(
            @inject(NoticeStore) protected readonly noticeStore: NoticeStore,
            @inject(AuthStore) private readonly authStore: AuthStore,
            @inject(AppStore) private readonly appStore: AppStore,
            @inject(MainPlayerStore) private readonly mainPlayerStore: MainPlayerStore,
            @inject(UserService) private readonly userService: UserService,
            @inject(SignOut) private readonly signOutHandler: SignOut,
            @inject(NotificationHandlers.Connect)
            private readonly notificationHandlers: NotificationHandlers.Connect
        ) {}

        async handle({ session = "", username = "" }) {
            try {
                const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
                this.session = session || sessionInfo?.session;
                this.username = username || sessionInfo?.username;
                const response = (await this.userService.authorize(this.session, this.username)) as IAuthorizeResponse;
                if (response.isUM) {
                    this.appStore.setUM(response.umInfo);
                } else {
                    if (response.isSuccessful !== undefined && !response.isSuccessful) {
                        this.signOutHandler.handle();
                    } else {
                        await this.handleAuthorizedResponse(response);
                        this.notificationHandlers.handle(sessionInfo);
                    }
                }
            } catch (err) {
                sentryLogger.logError(err);
            }
        }

        private async handleAuthorizedResponse(response: IAuthorizeResponse) {
            if (this.needAutoGenerateNickname(response.authorized)) {
                await this.autoGenerateName();
            } else {
                if (!response.authorized && !response.user) {
                    this.authStore.isShowSignName = true;
                } else {
                    response.user && this.mainPlayerStore.setAuthorizeStore(response.user);
                    this.authStore.isAuthorized = response.authorized;
                }
            }
        }

        private needAutoGenerateNickname(isAuthorized: boolean) {
            return !isAuthorized && this.appStore.isAutoCreateNickname;
        }

        private async autoGenerateName() {
            this.handleSignName(NameGenerator.generateName());
        }

        async handleSignName(username: string) {
            const response = (await this.userService.signName(this.session, this.username, username)) as IAuthorizeResponse;
            if (response.authorized) {
                this.authStore.isShowSignName = false;
                await this.handleAuthorizedResponse(response);
            } else {
                this.showErrorMessageSignName(response.errorCode);
            }
        }

        private showErrorMessageSignName(errorCode: string) {
            const key = ErrorUtils.parseErrorCode(errorCode);
            const text = Translator.translate(key);
            this.noticeStore.addNotice({
                message: text,
                title: Translator.commonTranslate("notice"),
                type: NoticeType.Error,
                onClose: () => {},
                showBtnConfirmButton: true,
                noticeInfo: NoticeInfo.SignName,
            });
        }
    }

    @injectable()
    export class SSO implements IHandler<URLSearchParams> {
        constructor(
            @inject(AuthStore) private readonly authStore: AuthStore,
            @inject(AppStore) private readonly appStore: AppStore,
            @inject(UserService) private readonly userService: UserService,
            @inject(Authorize) private readonly authorizeHandler: Authorize,
            @inject(SignOut) private readonly signOutHandler: SignOut,
            @inject(PlayerSelectionHandlers.ClearHandlers)
            private readonly playerSelectionClearHandler: PlayerSelectionHandlers.ClearHandlers
        ) {}

        async handle(urlParams: URLSearchParams) {
            try {
                if (!this.isValidSessionStorage(urlParams)) {
                    return;
                }

                await this.handleAuthorizeWithURLParams(urlParams);
            } catch (err) {
                this.authStore.ssoErrorMessage = Translator.commonTranslate("splash_connection_lost");
                sentryLogger.logError(err);
            }
        }

        private isValidSessionStorage(urlParams: URLSearchParams) {
            const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
            const isSessionExpired = verifySession(sessionInfo);
            if (isSessionExpired && !(urlParams?.has(URLParams.token) || urlParams?.has(URLParams.params))) {
                this.signOutHandler.handle();
                return false;
            }

            return true;
        }

        private async handleAuthorizeWithURLParams(urlParams: URLSearchParams) {
            if (urlParams?.has(URLParams.token)) {
                this.playerSelectionClearHandler.handle();
                this.appStore.setURLStore(urlParams);
                const token = urlParams.get(URLParams.token);
                const system = +urlParams.get(URLParams.appType) || AppTypes.Club;

                if (urlParams?.has(URLParams.returnUrl)) {
                    this.appStore.setURLStore(urlParams);
                }

                if (urlParams?.has(URLParams.operator)) {
                    StorageManager.set(localStorageKeys.operator, urlParams.get(URLParams.operator));
                }

                await this.handleSSOAndAuthorize(token, system);
                BrowserDomUtils.postMessageToParent({ hasSSO: true });
            } else {
                if (urlParams?.has(URLParams.params)) {
                    this.playerSelectionClearHandler.handle();
                    this.handleAuthorizeFromMainClient(urlParams);
                } else {
                    this.authStore.setAuthStoreFromStorage(StorageManager.get(localStorageKeys.session) as ISessionInfo);
                    this.appStore.loadReturnUrlAnd();
                    this.appStore.loadDirectMode();
                    this.appStore.loadPortraitDirectMode();
                    this.appStore.loadApp();
                    await this.handleAuthorize();
                }
            }
        }

        private async handleSSOAndAuthorize(token: string, system: number) {
            const response = await this.userService.sso(token, system);
            if (response.isUM) {
                this.appStore.setUM(response.umInfo);
                return;
            }
            if (response.isAuthenticated) {
                this.authStore.setAuthSSOStore(response);
                this.saveDataSSOInStorage();
                await this.handleAuthorize(response.ss, response.username);
            } else {
                this.authStore.ssoErrorMessage = Translator.commonTranslate("splash_login_failed");
            }
        }

        private async handleAuthorizeFromMainClient(urlParams: URLSearchParams) {
            const params = GameUtils.base64Decode(urlParams.get(URLParams.params));
            const urlSearchParams = new URLSearchParams(params);
            this.authStore.setAuthStoreFromUrlParam(urlSearchParams);
            this.appStore.setURLStore(urlSearchParams);
            this.saveDataSSOInStorage(urlSearchParams);
            const session = urlSearchParams.get(URLParams.session);
            const username = urlSearchParams.get(URLParams.username);

            await this.handleAuthorize(session, username);
        }

        private saveDataSSOInStorage(urlParams?: URLSearchParams) {
            this.clearDataSSOInStorage();
            StorageManager.set(localStorageKeys.session, this.authStore.getSessionInfo());
            if (this.appStore.isDirectMode) {
                this.appStore.saveDirectModeInfo();
            }

            if (this.appStore.isPortraitDirectMode) {
                this.appStore.savePortraitDirectModeInfo();
            }

            this.appStore.saveReturnUrl();
            this.appStore.saveIsApp();
            if (urlParams) {
                const playerSetting: UserSettingData = {
                    musicEnable: urlParams.has(URLParams.musicEnable) ? urlParams.get(URLParams.musicEnable) === "true" : true,
                    sfxEnable: urlParams.has(URLParams.sfxEnable) ? urlParams.get(URLParams.sfxEnable) === "true" : true,
                };
                StorageManager.set(localStorageKeys.playerSetting, playerSetting);

                if (urlParams.has(URLParams.gameIdsSupportBoostedOddsForInstantSite)) {
                    StorageManager.set(
                        localStorageKeys.gameIdsSupportBoostedOddsForInstantSite,
                        urlParams.get(URLParams.gameIdsSupportBoostedOddsForInstantSite)
                    );
                }

                if (urlParams.has(URLParams.operator)) {
                    StorageManager.set(localStorageKeys.operator, urlParams.get(URLParams.operator));
                }

                if (urlParams.has(URLParams.supportedGamesId)) {
                    StorageManager.set(localStorageKeys.supportedGamesId, urlParams.get(URLParams.supportedGamesId));
                }
            }
        }

        private clearDataSSOInStorage() {
            StorageManager.remove(localStorageKeys.session);
            StorageManager.remove(localStorageKeys.directMode);
            StorageManager.remove(localStorageKeys.returnUrl);
            StorageManager.remove(localStorageKeys.isApp);
            StorageManager.remove(localStorageKeys.portraitDirectMode);
        }

        private async handleAuthorize(session?: string, username?: string) {
            this.clearQueryStringOnUrl();
            if (!session || !username) {
                const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
                if (!sessionInfo) {
                    this.signOutHandler.handle();
                    return;
                }
                session = sessionInfo.session;
                username = sessionInfo.username;
            }
            await this.authorizeHandler.handle({ session, username });
        }

        private clearQueryStringOnUrl() {
            try {
                BrowserDomUtils.postMessageToParent({ clearQueryStringOnUrl: true });
                history.pushState(null, "", location.href.split("?")[0]);
            } catch (ex) {
                console.log(ex);
            }
        }
    }

    @injectable()
    export class ReCheckIn implements IHandler<{ sessionInfo: ISessionInfo }> {
        constructor(
            @inject(AuthStore) private readonly authStore: AuthStore,
            @inject(MainPlayerStore) private readonly mainPlayerStore: MainPlayerStore,
            @inject(UserService) private readonly userService: UserService,
            @inject(SignOut) private readonly signOutHandler: SignOut
        ) {}

        async handle({ sessionInfo }) {
            const { session, username } = sessionInfo;
            const response = await this.userService.reCheckIn(session || this.authStore.session, username || this.authStore.username);
            if (response.isSuccessful) {
                this.handleSuccessful(response, sessionInfo);
            } else {
                this.signOutHandler.handle();
            }
        }

        private handleSuccessful(response: ReCheckInResponse, sessionInfo: ISessionInfo) {
            if (response.apiError) {
                this.handleError(response);
            } else {
                this.authStore.setAuthStoreFromStorage(sessionInfo);
                StorageManager.set(localStorageKeys.session, this.authStore.getSessionInfo());
                this.mainPlayerStore.setBalance(response.balance, response.scoins, response.availSpins);
            }
        }

        private handleError(response: ReCheckInResponse) {
            if (response.isDisableAccount) {
                this.authStore.isDisabledAccount = response.isDisableAccount;
            }
            const errorCode = response.apiError.errorCode.toString();
            this.authStore.errorCode = errorCode;
        }
    }

    @injectable()
    export class TriggerRecheckIn implements IHandler<void> {
        private reCheckInId: NodeJS.Timeout;

        constructor(@inject(ReCheckIn) private readonly reCheckIn: ReCheckIn, @inject(SignOut) private readonly signOutHandler: SignOut) {}

        async handle() {
            this.clearInterval();
            this.reCheckInId = setInterval(() => {
                this.handleRecheckIn();
            }, 60 * 1000);
            this.handleRecheckIn();
        }

        private async handleRecheckIn() {
            try {
                const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
                const isSessionExpired = verifySession(sessionInfo);

                if (isSessionExpired) {
                    this.signOutHandler.handle();
                } else {
                    await this.reCheckIn.handle({ sessionInfo });
                }
            } catch (error) {
                sentryLogger.logError(error);
            }
        }

        clearInterval() {
            this.reCheckInId && clearInterval(this.reCheckInId);
        }
    }

    @injectable()
    export class GetBalance implements IHandler<void> {
        constructor(
            @inject(AuthStore) private readonly authStore: AuthStore,
            @inject(MainPlayerStore) private readonly mainPlayerStore: MainPlayerStore,
            @inject(UserService) private readonly userService: UserService
        ) {}

        async handle() {
            const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
            const response = await this.userService.getBalance(
                this.authStore.session || sessionInfo?.session,
                this.authStore.username || sessionInfo?.username
            );
            if (response.isSuccessful) {
                this.mainPlayerStore.setBalance(response.balance, response.scoins, response.availableSpins);
            } else {
                this.authStore.errorCode = response.errorCode;
            }
        }
    }

    @injectable()
    export class ClearRecheckInInterval implements IHandler<void> {
        constructor(@inject(TriggerRecheckIn) private readonly triggerRecheckIn: TriggerRecheckIn) {}

        handle() {
            this.triggerRecheckIn.clearInterval();
            StorageManager.remove(localStorageKeys.session);
        }
    }

    const SESSION_EXPIRED_TIMEOUT_MINUTES = 19.8;
    const verifySession = (sessionInfo: ISessionInfo) => {
        let isSessionExpired = true;

        try {
            if (sessionInfo && sessionInfo.ssoTime) {
                const now: Date = new Date();
                const lastRecheckIn: Date = new Date(sessionInfo.ssoTime);
                const differenceInMinutes = Math.abs(now.getTime() - lastRecheckIn.getTime()) / (1000 * 60);

                if (differenceInMinutes <= SESSION_EXPIRED_TIMEOUT_MINUTES) {
                    isSessionExpired = false;
                }
            }
        } catch (ex) {
            sentryLogger.logError(ex);
            console.log(ex);
        }

        return isSessionExpired;
    };
}
