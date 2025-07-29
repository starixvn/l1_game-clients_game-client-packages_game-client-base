import { inject, injectable } from "inversify";

import { AuthStore } from "../../auth/auth-store";
import { SiteConfigs } from "../../configs";
import { MainPlayerStore } from "../../players/main-player-store";
import { IHandler } from "../../shared";
import { AppTypes } from "../../shared/constants/app-type";
import { localStorageKeys, StorageManager, Translator, UrlUtils } from "../../shared/utils";
import { GameConfigStore, GameSetting } from "../game-configs";
import { RoundStore } from "../rounds/round-store";
import { GameGuideStore } from "./game-guide-store";

export namespace GameGuideHandlers {
    @injectable()
    export class GetGuideURL implements IHandler<{ theme: string; specialDirection: string }> {
        constructor(
            @inject(SiteConfigs) private readonly siteConfigs: SiteConfigs,
            @inject(GameSetting) private readonly gameSetting: GameSetting,
            @inject(AuthStore) private readonly authStore: AuthStore,
            @inject(MainPlayerStore) private readonly playerStore: MainPlayerStore,
            @inject(RoundStore) private readonly roundStore: RoundStore,
            @inject(GameConfigStore) private readonly gameConfigStore: GameConfigStore,
            @inject(GameGuideStore) private readonly guideStore: GameGuideStore
        ) {}

        handle({ theme, specialDirection, scrollToId }: { theme: string; specialDirection: string; scrollToId: string }) {
            const domain = UrlUtils.buildGameGuideUrl(this.siteConfigs);
            const params = {
                gId: this.gameSetting.id,
                t: theme,
                f: this.getAppTypeName(),
                p: this.gameConfigStore.boostedChoices?.length > 0,
                v: Date.now(),
                fof: this.playerStore.fractionalOddsFormat,
                minBet: this.roundStore.minBet,
                maxBet: this.roundStore.maxBet,
                scrollToId: scrollToId,
                displayName: Translator.gameTranslate("game_name"),
            };
            const queryString = Object.keys(params)
                .map((key) => `${key}=${params[key]}`)
                .join("&");
            this.guideStore.url = `${domain}/${this.getLanguage()}?${queryString}${specialDirection}`;
        }

        private getAppTypeName(): string {
            switch (this.authStore.system) {
                case AppTypes.Mobi:
                case AppTypes.MegaKeno:
                    return "sm";
                case AppTypes.Instant:
                    return "si";
                default:
                    return "sc";
            }
        }

        private getLanguage(): string {
            return (StorageManager.get(localStorageKeys.currentLanguage) as string) || Translator.defaultLanguageId;
        }
    }
}
