import { inject, injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { AppStore } from "../../app/app-store";
import { AuthStore } from "../../auth";
import { SiteConfigs } from "../../configs/site-configs";
import { Mediator } from "../../shared";
import { UrlUtils } from "../../shared/utils";
import { GameSetting } from "../game-configs";
import { ConnectionStoreBase } from "./connection-store-base";

@injectable()
export class ConnectionTrialStore extends ConnectionStoreBase {
    constructor(
        @inject(Mediator) protected readonly mediator: Mediator,
        @inject(GameSetting) protected readonly gameSetting: GameSetting,
        @inject(SiteConfigs) protected readonly siteConfigs: SiteConfigs,
        @inject(AuthStore) protected readonly authStore: AuthStore,
        @inject(AppStore) protected readonly appStore: AppStore
    ) {
        makeAutoObservable(this);
    }

    protected createSocketUri(gameId: number) {
        return UrlUtils.buildTrialServerUrl("http", `${this.siteConfigs.websocket.proxyPath}`, gameId, this.siteConfigs);
    }
}
