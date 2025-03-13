import { inject, injectable } from "inversify";
import { IHandler } from "../shared/mediator";
import { GameConfigurationStore } from "./game-configuration-store";
import { UrlUtils } from "../shared/utils/url-utils";
import { SiteConfigs } from "../configs/site-configs";
import { when } from "mobx";
import { AppStore } from "../app/app-store";

@injectable()
export class GameConfigurationHandler implements IHandler<void> {
    constructor(
        @inject(GameConfigurationStore) private readonly gameConfigurationStore: GameConfigurationStore,
        @inject(SiteConfigs) private readonly siteConfigs: SiteConfigs,
        @inject(AppStore) private readonly appStore: AppStore
    ) {
        when(
            () => this.appStore.isStandalone,
            () => this.handle()
        );
    }

    async handle() {
        const response = await fetch(UrlUtils.buildGameConfiguration(this.siteConfigs));
        const data = await response.json();
        this.gameConfigurationStore.setGameConfiguration(data);
    }
}
