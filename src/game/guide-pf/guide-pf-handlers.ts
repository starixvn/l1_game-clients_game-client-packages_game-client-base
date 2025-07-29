import { inject, injectable } from "inversify";
import { SiteConfigs } from "../../configs/site-configs";
import { localStorageKeys, StorageManager, Translator } from "../../shared/utils";
import { UrlUtils } from "../../shared/utils/url-utils";
import { GameSetting } from "../game-configs/game-setting";
import { GuidePFStore } from "./guide-pf-store";
@injectable()
export class GuidePFHandlers {
    constructor(
        @inject(SiteConfigs) private readonly siteConfigs: SiteConfigs,
        @inject(GameSetting) private readonly gameSetting: GameSetting,
        @inject(GuidePFStore) private readonly guidePFStore: GuidePFStore
    ) {}
    handle() {
        const domain = UrlUtils.buildGameGuideUrl(this.siteConfigs);
        const term = "pf";
        const params = {
            gId: this.gameSetting.id,
            t: term,
            f: term,
            c: 0,
            v: Date.now(),
            displayName: Translator.gameTranslate("game_name"),
        };
        const queryString = Object.keys(params)
            .map((key) => `${key}=${params[key]}`)
            .join("&");
        this.guidePFStore.url = `${domain}/${this.getLanguage()}?${queryString}`;
    }

    resetUrl() {
        this.guidePFStore.url = "";
    }
    private getLanguage(): string {
        return (StorageManager.get(localStorageKeys.currentLanguage) as string) || Translator.defaultLanguageId;
    }
}
