import { inject, injectable } from "inversify";
import { ISessionInfo } from "../auth";
import { PlayerSelectionHandlers } from "../game/player-selections";
import { IHandler } from "../shared";
import { BrowserDomUtils, GameUtils, StorageManager, localStorageKeys, sentryLogger } from "../shared/utils";
import { AppStore } from "./app-store";
import { UserSettingData } from "../game/user-settings";
import { GameConfigurationStore } from "../game-configuration/game-configuration-store";

export namespace AppHandlers {
    @injectable()
    export class BackToOperatorLobby implements IHandler<void> {
        constructor(
            @inject(AppStore) private readonly appStore: AppStore,
            @inject(PlayerSelectionHandlers.ClearHandlers)
            private readonly playerSelectionClearHandler: PlayerSelectionHandlers.ClearHandlers,
            @inject(GameConfigurationStore)
            private readonly gameConfigurationStore: GameConfigurationStore
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
                const gatewayId = this.appStore.urlInfo?.gatewayId ?? 0;
                this.handleStandaloneNavigation(0, gatewayId);
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

        private handleStandaloneNavigation(gameId?: number, gatewayId?: number) {
            const baseUrl = this.getUpdatedBaseUrl(gameId);
            const sessionParam = this.getSessionInfo();
            const operator = StorageManager.get(localStorageKeys.operator);
            const userSettings = StorageManager.get(localStorageKeys.playerSetting) as UserSettingData;

            const url = new URL(baseUrl);

            const mainParams = {
                cg: this.appStore.currencyGroup,
                op: operator,
                lang: sessionParam?.language,
                ...(gameId && gameId > 0 && { gameId: gameId.toString() }),
                ...(gatewayId && gatewayId > 0 && { gatewayId: gatewayId.toString() }),
            };

            const otherParams = {
                ...sessionParam,
                music: userSettings?.musicEnable ?? false,
                sfx: userSettings?.sfxEnable ?? false,
                isTouchedScreen: this.appStore.isTouchedScreen,
            };

            Object.entries(mainParams).forEach(([key, value]) => {
                url.searchParams.append(key, value.toString());
            });

            url.searchParams.append("params", GameUtils.base64Encode(JSON.stringify(otherParams)));

            window.location.replace(url);
        }

        private getUpdatedBaseUrl(gameId?: number): string {
            let baseUrl = String(this.getDecodedReturnUrl());

            if (!gameId || !this.gameConfigurationStore?.gameConfiguration) {
                return baseUrl;
            }

            const gameConfig = this.gameConfigurationStore.gameConfiguration.find((config) => config?.id === gameId);
            if (gameConfig && gameConfig?.isMicrosite) {
                baseUrl = baseUrl.endsWith("/") ? `${baseUrl}site-${gameId}/` : `${baseUrl}/site-${gameId}/`;
            }

            return baseUrl;
        }

        private handleIframeNavigation() {
            const params = this.getAuthorizationParams();
            BrowserDomUtils.postMessageToParent({ ...params, backLobby: true });
        }

        private getDecodedReturnUrl(): string {
            return GameUtils.base64Decode(this.appStore.urlInfo?.returnUrl ?? "");
        }

        private getBaseSessionInfo() {
            const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
            return {
                ss: sessionInfo?.session,
                time: new Date(sessionInfo?.ssoTime).getTime(),
                username: sessionInfo?.username,
                isAuthenticated: sessionInfo?.isAuthenticated,
                memberName: sessionInfo?.memberName,
                language: sessionInfo?.language,
            };
        }

        private getAuthorizationParams(gameId?: number) {
            const baseInfo = this.getBaseSessionInfo();
            return {
                ...baseInfo,
                gameId,
            };
        }

        private getSessionInfo() {
            const baseInfo = this.getBaseSessionInfo();
            const session = {
                ...baseInfo,
                system: (StorageManager.get(localStorageKeys.session) as ISessionInfo)?.system,
                isUM: this.appStore.isUM,
                umInfo: this.appStore.umInfo,
            };

            return session;
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
