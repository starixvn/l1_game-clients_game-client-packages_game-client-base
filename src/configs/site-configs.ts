export class SiteConfigs {
    systemType: string;
    ssl: boolean;
    serverDomainMapper?: { [key: string]: string };
    subDomain: string;
    env: string;
    sentryUrl?: string;
    subGuideDomain: string;
    enableMsgpackParserAllGames: boolean;
    enableMsgpackParserOnNotification: boolean;
    websocket: {
        proxyPath: string;
        route: string;
    };
    websocketOptions?: any;
    subDirectory?: string;
    isDev?: boolean;
    userServiceUrlDev?: string;
    SGConnectSubDomain?: string;
    notificationServiceUrlDev?: string;
    gameGuideUrlDev?: string;
    mainObserverNamespace: string;
    tolgeeUrl?: string;
    backgroundNoTranslate?: boolean;
    boostedOddsDelayTimeByMinutes?: number;
    storagePrefixKey?: string;
    gameServiceSubDomain?: string;
    gatewaySubDomain?: string;
    clientSubDomain?: string;
}
