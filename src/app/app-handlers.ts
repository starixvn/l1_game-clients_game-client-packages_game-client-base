import { inject, injectable } from "inversify";
import { ISessionInfo } from "../auth";
import { PlayerSelectionHandlers } from "../game/player-selections";
import { IHandler } from "../shared";
import { BrowserDomUtils, GameUtils, StorageManager, localStorageKeys, sentryLogger } from "../shared/utils";
import { AppStore } from "./app-store";
import { GameSetting } from "../game/game-configs/game-setting";

export namespace AppHandlers {
    @injectable()
    export class BackToOperatorLobby implements IHandler<void> {
        constructor(
            @inject(AppStore) private readonly appStore: AppStore,
            @inject(PlayerSelectionHandlers.ClearHandlers)
            private readonly playerSelectionClearHandler: PlayerSelectionHandlers.ClearHandlers,
            @inject(GameSetting) private readonly gameSetting: GameSetting
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
                this.handleStandaloneNavigation(0, this.gameSetting?.lobbyId ?? 0);
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
            BrowserDomUtils.replaceParentLocation(decodedUrl);
        }

        private handleStandaloneNavigation(gameId?: number, lobbyId?: number) {
            const decodedUrl = this.getDecodedReturnUrl();
            const sessionInfo = this.getSessionInfo();
            const url = new URL(`${decodedUrl}/?session=${sessionInfo}&cg=${this.appStore.currencyGroup}`);

            if (gameId && gameId > 0) {
                url.searchParams.append("gameId", gameId.toString());
            }

            if (lobbyId && lobbyId > 0) {
                url.searchParams.append("lobbyId", lobbyId.toString());
            }

            window.location.replace(url);
        }

        private handleIframeNavigation() {
            const params = this.getAuthorizationParams();
            BrowserDomUtils.postMessageToParent({ ...params, backLobby: true });
        }

        private getDecodedReturnUrl(): string {
            return GameUtils.base64Decode(this.appStore.urlInfo?.returnUrl);
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

            return GameUtils.base64Encode(JSON.stringify(session));
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
