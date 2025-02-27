import { inject, injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { Socket, io } from "socket.io-client/dist/socket.io.js";
import { io as ioMsgPack } from "socket.io-client/dist/socket.io.msgpack.min.js";
import { AuthStore, ISessionInfo } from "../../auth";
import { SiteConfigs } from "../../configs/site-configs";
import { GameClientEmitMessage, Mediator } from "../../shared";
import { SocketEvents } from "../../shared/constants/socket-event";
import { BrowserDomUtils, StorageManager, UrlUtils, localStorageKeys, sentryLogger } from "../../shared/utils";
import { GameSetting } from "../game-configs";
import { AppTypes } from "./../../shared/constants/app-type";

export const events = {
    ...SocketEvents,
    ...{
        signedIn: "signedIn",
    },
};

export interface ISocketOption {
    socketUri: string;
    proxyRoute?: string;
    forceNew?: boolean;
    enableMsgpackParser?: boolean;
    transports?: string[];
    upgrade?: boolean;
    path?: string;
    extraHeaders?: object;
}

@injectable()
export class ConnectionStore {
    readonly DEFAULT_CONNECTION_TIMEOUT = 1000;

    constructor(
        @inject(Mediator) protected readonly mediator: Mediator,
        @inject(GameSetting) protected readonly gameSetting: GameSetting,
        @inject(SiteConfigs) protected readonly siteConfigs: SiteConfigs,
        @inject(AuthStore) protected readonly authStore: AuthStore
    ) {
        makeAutoObservable(this);
    }

    connection: Socket = null;
    isConnected: boolean = null;
    isConnectFailed = false;
    signedIn = false;
    isDisconnect = false;

    mobileDirConnectionTimeout: NodeJS.Timeout;

    initConnection(customizeOptions?: ISocketOption) {
        this.reset();

        const gameId = this.gameSetting.id;
        const socketUri = UrlUtils.buildServerUrl("http", `${this.siteConfigs.websocket.proxyPath}`, gameId, this.siteConfigs);
        const optionsDefault: ISocketOption = {
            path: UrlUtils.getProxyRoute(this.siteConfigs),
            socketUri,
            transports: ["websocket"],
            upgrade: false,
            forceNew: true,
        };
        const options = { ...optionsDefault, ...customizeOptions };

        if (this.siteConfigs.enableMsgpackParserAllGames) {
            this.connection = ioMsgPack(options.socketUri, options);
        } else {
            this.connection = io(options.socketUri, options);
        }

        this.initBaseListener();
    }

    initBaseListener() {
        if (this.connection) {
            if (this.isMobileDirect()) {
                this.mobileDirConnectionTimeout = setTimeout(() => {
                    if (!this.isConnected) {
                        this.onConnectFailed();
                    }
                }, this.siteConfigs.websocket.connectionTimeout ?? this.DEFAULT_CONNECTION_TIMEOUT);

                this.connection.on(events.connect, () => {
                    clearTimeout(this.mobileDirConnectionTimeout);
                    this.onConnected();
                });
            } else {
                this.connection.on(events.connect, this.onConnected.bind(this));
            }

            this.connection.on(events.signedIn, this.onSignedIn.bind(this));
            this.connection.on(events.connectError, this.onConnectFailed.bind(this));
            this.connection.on(events.connectFailed, this.onConnectFailed.bind(this));
            this.connection.on(events.disconnect, this.onDisconnected.bind(this));
        }
    }

    onConnected() {
        this.isConnected = true;
        this.isConnectFailed = false;
        this.connection.onAny(this.onHandleData.bind(this));
        this.signIn();
    }

    onHandleData(event: string, data: any) {
        if (event?.toLocaleLowerCase() === this.gameSetting?.name.toLocaleLowerCase() || event?.toLocaleLowerCase() === "message") {
            Object.entries(data).forEach((entry) => {
                const [key, value] = entry;
                this.mediator.emit(key, value);
            });
        } else {
            this.mediator.emit(event, data);
        }

        this.emitMultipleKeyEvents(data);
    }

    emitMultipleKeyEvents(data: any) {
        if (!data || Object.keys(data).length < 2) {
            return;
        }

        const multipleKeyEvents = this.mediator.multipleKeyEvents;

        for (const eventName of multipleKeyEvents) {
            const requiredKeys = eventName.split(",").map((key) => key.trim());

            const hasAllKeys = requiredKeys.every((key) => !!data[key]);
            if (hasAllKeys) {
                const eventData = requiredKeys.reduce((acc, key) => {
                    acc[key] = data[key];
                    return acc;
                }, {} as Record<string, any>);

                this.mediator.emit(eventName, eventData);
            }
        }
    }

    signIn() {
        const payload = new GameClientEmitMessage.Signin();
        const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
        payload.ss = sessionInfo?.session;
        payload.username = sessionInfo?.username;
        payload.system = sessionInfo?.system;

        this.send(GameClientEmitMessage.Signin.eventName, payload);
    }

    onSignedIn() {
        this.signedIn = true;
    }

    onConnectFailed(error?: Error) {
        this.isConnectFailed = true;
        this.isInstant() && this.postDisconnectMessage();
        this.handleConnectionStatus(false, error);
    }

    onDisconnected(reason = "") {
        this.handleDisconnectionReason(reason);
        this.isInstant() && this.handleDisconnectInstant(reason);
        this.handleConnectionStatus(false);
    }

    handleDisconnectionReason(reason = "") {
        if (this.isServerDisconnect(reason)) {
            this.isDisconnect = true;
            return;
        }

        if (this.shouldLogDisconnection(reason)) {
            this.isConnectFailed = true;
        }
    }

    handleConnectionStatus(connected: boolean, error?: Error) {
        this.isConnected = connected;
        this.signedIn = connected;
        this.connection.disconnect();
        error && this.logError(error);
    }

    handleDisconnectInstant(reason: string | unknown) {
        if (this.shouldPostDisconnectMessage(reason)) {
            this.postDisconnectMessage();
        }
    }

    private shouldPostDisconnectMessage(reason: string | unknown) {
        return this.isServerDisconnect(reason) || this.isTransportClose(reason);
    }

    private isServerDisconnect(reason: string | unknown) {
        return reason === "io server disconnect";
    }

    private isTransportClose(reason: string | unknown) {
        return reason === "transport close";
    }

    private postDisconnectMessage() {
        BrowserDomUtils.postMessageToParent({ isDisconnect: true });
    }

    private shouldLogDisconnection(reason: string | unknown) {
        return reason && reason !== "io client disconnect";
    }

    private logError(reason: string | Error) {
        sentryLogger.logError(reason);
    }

    private isInstant() {
        return this.authStore.system === AppTypes.Instant;
    }

    private isMobileDirect() {
        return this.authStore.system === AppTypes.MobileDirect;
    }

    send(eventName: string, data: any) {
        this.connection?.emit(eventName, data);
    }

    closeSocket() {
        this.connection?.disconnect();
    }

    reset() {
        this.connection = null;
        this.isConnected = null;
        this.isConnectFailed = false;
        this.signedIn = false;
        this.isDisconnect = false;
        this.isMobileDirect() && clearTimeout(this?.mobileDirConnectionTimeout);
    }
}
