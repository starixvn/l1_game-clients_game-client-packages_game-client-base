import { inject, injectable } from "inversify";
import { AppStore } from "../app/app-store";
import { AuthStore } from "../auth/auth-store";
import { SiteConfigs } from "../configs";
import { IHandler } from "../shared";
import { BrowserDomUtils, UrlUtils } from "../shared/utils";

export namespace ConnectSiteHandlers {
    const ConnectSitePath = {
        sessionTimeout: "/timeout",
        underMaintenance: "/um",
        login: "",
    };

    @injectable()
    export class RedirectToTimeoutPage implements IHandler<void> {
        constructor(
            @inject(SiteConfigs) private readonly siteConfigs: SiteConfigs,
            @inject(AuthStore) private readonly authStore: AuthStore
        ) { }

        handle() {
            redirectToAppPage(this.siteConfigs, ConnectSitePath.sessionTimeout, this.authStore.language);
        }
    }

    @injectable()
    export class RedirectToUMPage implements IHandler<void> {
        constructor(
            @inject(SiteConfigs) private readonly siteConfigs: SiteConfigs,
            @inject(AuthStore) private readonly authStore: AuthStore,
            @inject(AppStore) private readonly appStore: AppStore
        ) { }

        handle() {
            const otherQueryString = this.appStore.umInfo?.operatorId ? `operatorId=${this.appStore.umInfo?.operatorId}` : "";
            redirectToAppPage(this.siteConfigs, ConnectSitePath.underMaintenance, this.authStore.language, otherQueryString);
        }
    }

    @injectable()
    export class RedirectToLoginPage implements IHandler<void> {
        constructor(
            @inject(SiteConfigs) private readonly siteConfigs: SiteConfigs,
            @inject(AuthStore) private readonly authStore: AuthStore
        ) { }

        handle() {
            redirectToAppPage(this.siteConfigs, ConnectSitePath.login, this.authStore.language);
        }
    }

    const redirectToAppPage = (siteConfigs: SiteConfigs, path: string, language: string, otherQueryString = ""): void => {
        BrowserDomUtils.replaceParentLocation(
            `${UrlUtils.buildUrlFromSubDomain(siteConfigs, siteConfigs.SGConnectSubDomain)}${path}?language=${language}&${otherQueryString}`
        );
    };
}
