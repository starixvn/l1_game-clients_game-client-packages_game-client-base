import { inject, injectable } from "inversify";
import { makeObservable } from "mobx";
import { AppStore } from "../../app/app-store";
import { AuthStore } from "../../auth";
import { SiteConfigs } from "../../configs/site-configs";
import { Mediator } from "../../shared";
import { SocketEvents } from "../../shared/constants/socket-event";
import { GameSetting } from "../game-configs";
import { ConnectionStoreBase, ConnectionStoreProps } from "./connection-store-base";

export const events = {
    ...SocketEvents,
    ...{
        signedIn: "signedIn",
    },
};

@injectable()
export class ConnectionStore extends ConnectionStoreBase {
    constructor(
        @inject(Mediator) protected readonly mediator: Mediator,
        @inject(GameSetting) protected readonly gameSetting: GameSetting,
        @inject(SiteConfigs) protected readonly siteConfigs: SiteConfigs,
        @inject(AuthStore) protected readonly authStore: AuthStore,
        @inject(AppStore) protected readonly appStore: AppStore
    ) {
        super();
        makeObservable(this, {
            ...ConnectionStoreProps,
        });
    }
}
