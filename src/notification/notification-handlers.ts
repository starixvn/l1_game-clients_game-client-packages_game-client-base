import { inject, injectable } from "inversify";
import { ISessionInfo } from "../auth/auth-store";
import { SiteConfigs } from "../configs";
import { NotificationServiceMessage } from "../shared";
import { UrlUtils } from "../shared/utils";
import { NotificationStore } from "./notification-store";

export namespace NotificationHandlers {
    @injectable()
    export class Connect {
        constructor(
            @inject(NotificationStore) readonly notificationStore: NotificationStore,
            @inject(SiteConfigs) protected readonly siteConfigs: SiteConfigs
        ) { }

        handle(sessionInfo: ISessionInfo) {
            const { isDev, enableMsgpackParserOnNotification, subDirectory } = this.siteConfigs;
            const socketUri = isDev ? this.siteConfigs.notificationServiceUrlDev : UrlUtils.buildUrl("http", "/", this.siteConfigs);

            const options = {
                path: `/${UrlUtils.getSubDirectory(subDirectory)}${isDev ? "" : "notification/"}socket.io`,
                socketUri,
                transports: ["websocket"],
                upgrade: false,
                forceNew: true,
                auth: {
                    ss: sessionInfo.session,
                    username: sessionInfo.username,
                },
                enableMsgpackParserOnNotification
            };
            this.notificationStore.init(options);
        }
    }

    @injectable()
    export class InitPromotionNotifications {
        constructor(@inject(NotificationStore) readonly notificationStore: NotificationStore) { }

        handle() {
            this.notificationStore.send(NotificationServiceMessage.PromotionNotifications.eventName);
        }
    }
}
