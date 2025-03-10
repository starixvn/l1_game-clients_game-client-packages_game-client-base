import { inject, injectable } from "inversify";
import { ISessionInfo } from "../auth";
import { PlayerSelectionHandlers } from "../game/player-selections";
import { IHandler } from "../shared";
import { BrowserDomUtils, GameUtils, StorageManager, localStorageKeys, sentryLogger } from "../shared/utils";
import { AppStore } from "./app-store";
import { GameSetting } from "../game/game-configs";

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

                if (this.appStore.isDirectMode) {
                    this.handleDirectModeNavigation();
                    return;
                }

                if (this.appStore.isStandalone) {
                    this.handleStandaloneNavigation(this.gameSetting?.id ?? 0);
                    return;
                }

                this.handleIframeNavigation();
            } catch (err) {
                sentryLogger.logError(err);
                this.appStore.isLoading = false;
            }
        }

        private handleDirectModeNavigation() {
            const decodedUrl = GameUtils.base64Decode(this.appStore.urlInfo!.returnUrl);
            BrowserDomUtils.replaceParentLocation(decodedUrl);
        }

        private handleStandaloneNavigation(gameId: number) {
            const decodedUrl = GameUtils.base64Decode(this.appStore.urlInfo!.returnUrl);
            const sessionInfo = this.getSessionInfo();

            const url = new URL(`${decodedUrl}/?session=${sessionInfo}&gameId=${gameId}&cg=${this.appStore.currencyGroup}`);

            window.location.replace(url);
        }

        private handleIframeNavigation() {
            const params = this.getAuthorizationParams();
            BrowserDomUtils.postMessageToParent({ ...params, backLobby: true });
        }

        handleOpenGame(gameId: number) {
            this.appStore.isLoading = true;
            this.playerSelectionClearHandler.handle();
            const params = this.getAuthorizationParams(gameId);
            BrowserDomUtils.postMessageToParent({ ...params, backLobby: true });
        }

        private getAuthorizationParams(gameId?: number) {
            const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
            return {
                ss: sessionInfo?.session,
                time: new Date(sessionInfo?.ssoTime).getTime(),
                username: sessionInfo?.username,
                isAuthenticated: sessionInfo?.isAuthenticated,
                memberName: sessionInfo?.memberName,
                language: sessionInfo?.language,
                gameId,
            };
        }

        private getSessionInfo() {
            const storedSession = StorageManager.get(localStorageKeys.session) as ISessionInfo;
            const session = {
                ss: storedSession?.session,
                time: storedSession?.ssoTime,
                language: storedSession?.language,
                memberName: storedSession?.memberName,
                username: storedSession?.username,
                isAuthenticated: storedSession?.isAuthenticated,
                system: storedSession?.system,
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
