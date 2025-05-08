import gc from "@sg/game-client-base";
declare global {
    interface Window {
        envConfig: gc.Configs.SiteConfigs;
    }
}

// Dev Machine
// const defaultConfig: gc.Configs.SiteConfigs = {
//     isDev: true, // if this property is true, then you should add token=anything into the querytring to sso to the game http://localhost:7456/?token=anything
//     systemType: "SG",
//     ssl: false,
//     serverDomainMapper: {
//         localhost: "localhost:5002",
//     },
//     subDomain: "",
//     env: "LOCAL",
//     subGuideDomain: "",
//     SGConnectSubDomain: "connectsite",
//     enableMsgpackParserAllGames: false,
//     enableMsgpackParserOnNotification: false,
//     userServiceUrlDev: "http://localhost:3000/user",
//     notificationServiceUrlDev: "http://localhost:3008",
//     gameGuideUrlDev: "http://localhost:3000/guide",
//     websocket: {
//         proxyPath: "sedie",
//         route: "",
//     },
//     mainObserverNamespace: "SeDie",
// };

// LOCAL3
const defaultConfig: gc.Configs.SiteConfigs = {
    isDev: false, // if this property is true, then you should add token=anything into the querytring to sso to the game http://localhost:7456/?token=anything
    systemType: "SG",
    ssl: true,
    subDomain: "l1-proxy3",
    serverDomainMapper: {
        localhost: "lumigame.com",
    },
    env: "LOCAL3",
    sentryUrl: "https://2af29bdacdbf4d9ba2db6600b450541f@sentry.lumigame.com/28",
    subGuideDomain: "l1-guide-3",
    enableMsgpackParserOnNotification: false,
    enableMsgpackParserAllGames: false,
    websocket: {
        proxyPath: "sedie",
        route: "sedie",
    },
    SGConnectSubDomain: "l1-connectsite3",
    tolgeeUrl:
        "https://tolgee.sabagame.com/v2/projects/5/translations?ak=tgpak_gvpw45brha2xg3btoztxeytunvudc5dbn5twqodtonztc&size=1000&filterNamespace=Common,DragonTigerFight&languages=",
    boostedOddsDelayTimeByMinutes: 2,
};

let configDev = {
    isDev: defaultConfig.isDev,
    userServiceUrlDev: defaultConfig.userServiceUrlDev,
    serverDomainMapper: defaultConfig.serverDomainMapper,
    notificationServiceUrlDev: defaultConfig.notificationServiceUrlDev,
};

if (window.envConfig) {
    configDev = {
        isDev: undefined,
        userServiceUrlDev: undefined,
        serverDomainMapper: undefined,
        notificationServiceUrlDev: undefined,
    };
}

export const siteConfigs: gc.Configs.SiteConfigs =
    window.envConfig && window.envConfig.isDev ? defaultConfig : { ...defaultConfig, ...configDev, ...window.envConfig };

window.envConfig = siteConfigs;
gc.Shared.utils.StorageManager.setPrefixKey(siteConfigs.storagePrefixKey);
