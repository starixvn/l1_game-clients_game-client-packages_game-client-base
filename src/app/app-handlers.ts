import { inject, injectable } from "inversify";
import { ISessionInfo } from "../auth";
import { SiteConfigs } from "../configs";
import { GameConfigurationStore } from "../game-configuration/game-configuration-store";
import { PlayerSelectionHandlers } from "../game/player-selections";
import { UserSettingData } from "../game/user-settings";
import { IHandler } from "../shared";
import { URLParams } from "../shared/constants/url-params";
import { BrowserDomUtils, GameUtils, StorageManager, UrlUtils, localStorageKeys, sentryLogger } from "../shared/utils";
import { AppStore } from "./app-store";

export interface OtherParams {
    musicEnable?: boolean;
    sfxEnable?: boolean;
    isUserGesture?: boolean;
    system?: number;
    isUM?: boolean;
    umInfo?: any;
    ss?: string;
    time?: number;
    username?: string;
    isAuthenticated?: boolean;
    memberName?: string;
    language?: string;
    isStandalone?: string;
    cg?: string;
    op?: string;
    [key: string]: unknown;
}

export namespace AppHandlers {
    @injectable()
    export class BackToOperatorLobby implements IHandler<void> {
        constructor(
            @inject(AppStore) private readonly appStore: AppStore,
            @inject(PlayerSelectionHandlers.ClearHandlers)
            private readonly playerSelectionClearHandler: PlayerSelectionHandlers.ClearHandlers,
            @inject(GameConfigurationStore)
            private readonly gameConfigurationStore: GameConfigurationStore,
            @inject(SiteConfigs) private readonly siteConfigs: SiteConfigs
        ) {}

        handle() {
            this.playerSelectionClearHandler.handle();

            if (!this.appStore.urlInfo?.returnUrl) {
                return;
            }

            try {
                this.appStore.isLoading = true;
                this.navigateBasedOnMode();
            } catch (err) {
                sentryLogger.logError(err);
                this.appStore.isLoading = false;
            }
        }

        handleOpenGame(gameId: number) {
            this.appStore.isLoading = true;
            this.playerSelectionClearHandler.handle();
            this.navigateToGame(gameId);
        }

        private navigateBasedOnMode() {
            if (this.appStore.isDirectMode) {
                this.handleDirectModeNavigation();
                return;
            }

            if (this.appStore.isStandalone) {
                this.handleStandaloneNavigation(0);
                return;
            }

            this.handleIframeNavigation();
        }

        private navigateToGame(gameId: number) {
            if (this.appStore.isStandalone) {
                this.handleStandaloneNavigation(gameId);
                return;
            }

            const params = this.getAuthorizationParams(gameId);
            BrowserDomUtils.postMessageToParent({ ...params, backLobby: true });
        }

        private handleDirectModeNavigation() {
            const decodedUrl = this.getDecodedReturnUrl();
            if (this.appStore.isStandalone) {
                window.location.replace(decodedUrl);
                return;
            }

            BrowserDomUtils.replaceParentLocation(decodedUrl);
        }

        private handleStandaloneNavigation(gameId?: number) {
            const operator = StorageManager.get(localStorageKeys.operator)?.toString();
            const userSettings = StorageManager.get(localStorageKeys.playerSetting) as UserSettingData;
            const mainParams = this.buildMainParams(gameId, operator);
            const otherParams = this.buildOtherParams(userSettings, gameId);

            if (gameId) {
                const gameConfig = this.getGameConfig(gameId);
                const isMicrosite = gameConfig?.isMicrosite ?? false;
                if (isMicrosite) {
                    this.redirectWithEncodedParams(gameId, { ...mainParams, ...otherParams });
                } else {
                    const lobbyUrl = this.getDecodedLobbyLobbyUrl();
                    this.redirectWithUrlParams(lobbyUrl, mainParams, otherParams);
                }
            } else {
                const returnUrl = this.getDecodedReturnUrl();
                this.redirectWithUrlParams(returnUrl, mainParams, otherParams);
            }
        }

        private buildMainParams(gameId?: number, operator?: string) {
            return {
                [URLParams.currencyGroup]: this.appStore.currencyGroup,
                [URLParams.operator]: operator,
                [URLParams.language]: this.getSessionInfo()?.language,
                ...(gameId && { [URLParams.gameId]: gameId.toString() }),
                ...(this.appStore?.urlInfo?.ref && { [URLParams.ref]: this.appStore?.urlInfo?.ref }),
                ...(this.appStore?.urlInfo?.returnUrl && { [URLParams.returnUrl]: this.appStore?.urlInfo?.returnUrl }),
                ...(this.appStore?.urlInfo?.lobbyUrl && { [URLParams.lobbyUrl]: this.appStore?.urlInfo?.lobbyUrl }),
            };
        }

        private buildOtherParams(userSettings: UserSettingData, gameId?: number) {
            const sessionInfo = this.getSessionInfo();
            const otherParams: OtherParams = {
                ...sessionInfo,
                [URLParams.musicEnable]: userSettings?.musicEnable ?? false,
                [URLParams.sfxEnable]: userSettings?.sfxEnable ?? false,
                [URLParams.isUserGesture]: this.appStore?.isTouchedScreen,
            };

            if (gameId && gameId > 0) {
                const gameConfig = this.getGameConfig(gameId);
                if (gameConfig?.isMicrosite) {
                    Object.assign(otherParams, {
                        [URLParams.isStandalone]: "true",
                        [URLParams.appType]: this.getAppType(),
                        [URLParams.username]: sessionInfo?.username,
                        [URLParams.ref]: this.appStore.urlInfo?.ref,
                        [URLParams.returnUrl]: this.appStore.urlInfo?.returnUrl,
                        [URLParams.lobbyUrl]: this.appStore.urlInfo?.lobbyUrl,
                        [URLParams.currencyGroup]: this.appStore.currencyGroup,
                    });
                }
            }

            return otherParams;
        }

        private handleIframeNavigation() {
            const params = this.getAuthorizationParams();
            BrowserDomUtils.postMessageToParent({ ...params, backLobby: true });
        }

        private getDecodedReturnUrl(): string {
            return GameUtils.base64Decode(this.appStore.urlInfo?.returnUrl ?? "");
        }

        private getDecodedLobbyLobbyUrl(): string {
            return GameUtils.base64Decode(this.appStore.urlInfo?.lobbyUrl ?? "");
        }

        private getBaseSessionInfo() {
            const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
            return {
                [URLParams.session]: sessionInfo?.session,
                [URLParams.time]: new Date(sessionInfo?.ssoTime).getTime(),
                username: sessionInfo?.username,
                [URLParams.isAuthenticated]: sessionInfo?.isAuthenticated,
                [URLParams.memberName]: sessionInfo?.memberName,
                language: sessionInfo?.language,
            };
        }

        private getAuthorizationParams(gameId?: number) {
            return { ...this.getBaseSessionInfo(), gameId };
        }

        private getSessionInfo() {
            const session = {
                ...this.getBaseSessionInfo(),
                [URLParams.system]: this.getAppType(),
                [URLParams.isUM]: this.appStore.isUM,
                [URLParams.umInfo]: this.appStore.umInfo,
            };

            return session;
        }

        private getGameConfig(gameId: number) {
            return this.gameConfigurationStore.gameConfiguration.find((config) => config?.id === gameId);
        }

        private redirectWithEncodedParams(gameId: number, params: Record<string, any>) {
            const searchParams = new URLSearchParams();
            Object.keys(params).forEach((key) => {
                if (params[key] !== undefined && params[key] !== null) {
                    searchParams.append(key, params[key]);
                }
            });
            const baseUrl = UrlUtils.buildMicrositeGameUrl(this.siteConfigs, gameId);

            window.location.replace(`${baseUrl}/?params=${GameUtils.base64Encode(searchParams.toString())}`);
        }

        private redirectWithUrlParams(baseUrl: string, mainParams: Record<string, unknown>, otherParams: Record<string, unknown>) {
            const url = new URL(baseUrl);

            Object.entries(mainParams).forEach(([key, value]) => url.searchParams.append(key, value.toString()));
            url.searchParams.append("params", GameUtils.base64Encode(JSON.stringify(otherParams)));

            window.location.replace(url);
        }

        private getAppType() {
            return (StorageManager.get(localStorageKeys.session) as ISessionInfo)?.system;
        }
    }

    @injectable()
    export class UserGesturePage implements IHandler<boolean> {
        constructor(@inject(AppStore) private readonly appStore: AppStore) {}

        handle(isUserGesture: boolean) {
            this.appStore.isUserGesture = isUserGesture;
        }

        handleTouchScreen(isTouchedScreen: boolean) {
            this.appStore.isTouchedScreen = isTouchedScreen;
        }
    }

    @injectable()
    export class ClearStorage implements IHandler<boolean> {
        constructor(@inject(AppStore) private readonly appStore: AppStore) {}

        handle(isClearStorage: boolean) {
            this.appStore.isClearStorage = isClearStorage;
        }
    }
}
