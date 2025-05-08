import { SiteConfigs } from "../../../src/configs";

export const gameSettings = {
    id: 1,
    name: "SeDie",
    durations: {
        wholeRound: 39,
        lockingBet: 5,
        placingBet: 30,
    },
    numberOfRoundHistory: 100,
};
export const servicePort = 5002;

export const siteConfigs: SiteConfigs = {
    isDev: true,
    systemType: "SG",
    ssl: false,
    serverDomainMapper: {
        localhost: `localhost:${servicePort}`,
    },
    subDomain: "",
    env: "LOCAL",
    subGuideDomain: "l1-guide",
    enableMsgpackParserAllGames: false,
    enableMsgpackParserOnNotification: false,
    userServiceUrlDev: "https://localhost:3000/user",
    notificationServiceUrlDev: "https://localhost:3008",
    websocket: {
        proxyPath: "sedie",
        route: "",
    },
};
