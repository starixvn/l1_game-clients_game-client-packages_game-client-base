import { inject, injectable } from "inversify";
import { SiteConfigs } from "../../configs";
import { IHandler } from "../../shared";
import { StorageManager, Translator, UrlUtils, localStorageKeys } from "../../shared/utils";
import { GameSetting } from "../game-configs";
import { WebViewPFVerificationStore } from "./web-vew-verification-store";

export namespace WebViewPFVerificationHandlers {
    @injectable()
    export class VerificationPopupHandler implements IHandler<boolean> {
        constructor(@inject(WebViewPFVerificationStore) private readonly webViewPFStore: WebViewPFVerificationStore) {}

        handle(openPopup: boolean) {
            this.webViewPFStore.openVerificationPopup = openPopup ? {} : null;
        }
    }
    @injectable()
    export class GetVerificationURL implements IHandler<{ theme: string; specialDirection: string }> {
        constructor(
            @inject(SiteConfigs) private readonly siteConfigs: SiteConfigs,
            @inject(GameSetting) private readonly gameSetting: GameSetting,
            @inject(WebViewPFVerificationStore) private readonly webViewPFStore: WebViewPFVerificationStore
        ) {}

        handle({ theme, specialDirection, scrollToId }: { theme: string; specialDirection: string; scrollToId: string }) {
            const domain = UrlUtils.buildGameGuideUrl(this.siteConfigs);
            const params = {
                gId: this.gameSetting.id,
                displayName: Translator.gameTranslate("game_name"),
                t: "pf",
                v: Date.now(),
            };
            const queryString = Object.keys(params)
                .map((key) => `${key}=${params[key]}`)
                .join("&");
            this.webViewPFStore.url = `${domain}/${this.getLanguage()}/pf?${queryString}${specialDirection}`;
        }

        private getLanguage(): string {
            return (StorageManager.get(localStorageKeys.currentLanguage) as string) || Translator.defaultLanguageId;
        }
    }
}
