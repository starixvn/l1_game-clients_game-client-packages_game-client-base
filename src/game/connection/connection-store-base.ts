import { injectable } from "inversify";
import { action, observable } from "mobx";
import { Socket, io } from "socket.io-client/dist/socket.io.js";
import { io as ioMsgPack } from "socket.io-client/dist/socket.io.msgpack.min.js";
import { AppStore } from "../../app/app-store";
import { AuthStore, ISessionInfo } from "../../auth";
import { SiteConfigs } from "../../configs/site-configs";
import { GameClientEmitMessage, Mediator } from "../../shared";
import { AppTypes } from "../../shared/constants/app-type";
import { SocketEvents } from "../../shared/constants/socket-event";
import { BrowserDomUtils, StorageManager, UrlUtils, localStorageKeys, sentryLogger } from "../../shared/utils";
import { GameSetting } from "../game-configs";

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
    timeout?: number;
}

export const ConnectionStoreProps = {
    connection: observable,
    isConnected: observable,
    isConnectFailed: observable,
    signedIn: observable,
    isDisconnect: observable,
    initConnection: action,
    onDisconnected: action,
    send: action,
    closeSocket: action,
    createSocketUri: action,
    initBaseListener: action,
    onConnected: action,
    onHandleData: action,
    emitMultipleKeyEvents: action,
    signIn: action,
    onSignedIn: action,
    onConnectFailed: action,
    handleDisconnectionReason: action,
    handleConnectionStatus: action,
    handleDisconnectInstant: action,
    shouldPostDisconnectMessage: action,
    isServerDisconnect: action,
    isTransportClose: action,
    postDisconnectMessage: action,
    shouldLogDisconnection: action,
    logError: action,
    isInstant: action,
    reset: action,
};

@injectable()
export abstract class ConnectionStoreBase {
    protected readonly mediator: Mediator;
    protected readonly gameSetting: GameSetting;
    protected readonly siteConfigs: SiteConfigs;
    protected readonly authStore: AuthStore;
    protected readonly appStore: AppStore;

    connection: Socket = null;
    isConnected = false;
    isConnectFailed = false;
    signedIn = false;
    isDisconnect = false;
    currentSocketOption: ISocketOption = null;

    ///public method
    initConnection(customizeOptions?: ISocketOption) {
        this.currentSocketOption = customizeOptions;
        this.reset();

        const gameId = this.gameSetting.id;
        const socketUri = this.createSocketUri(gameId);
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

    reconnect() {
        if (!this.isConnected) {
            this.connection.off();
            this.initConnection(this.currentSocketOption);
        }
    }

    onDisconnected(reason = "") {
        this.handleDisconnectionReason(reason);
        this.isInstant() && this.handleDisconnectInstant(reason);
        this.handleConnectionStatus(false);
    }

    send(eventName: string, data: any) {
        this.connection?.emit(eventName, data);
    }

    closeSocket() {
        this.connection?.disconnect();
    }
    ///public method end ---------------------------------------

    protected createSocketUri(gameId: number) {
        return UrlUtils.buildServerUrl("http", `${this.siteConfigs.websocket.proxyPath}`, gameId, this.siteConfigs);
    }

    protected initBaseListener() {
        if (this.connection) {
            this.connection.on(events.connect, this.onConnected.bind(this));
            this.connection.on(events.signedIn, this.onSignedIn.bind(this));
            this.connection.on(events.connectError, this.onConnectFailed.bind(this));
            this.connection.on(events.connectFailed, this.onConnectFailed.bind(this));
            this.connection.on(events.disconnect, this.onDisconnected.bind(this));
        }
    }

    protected onConnected() {
        this.isConnected = true;
        this.isConnectFailed = false;
        this.connection.onAny(this.onHandleData.bind(this));
        this.signIn();
    }

    protected onHandleData(event: string, data: any) {
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

    protected emitMultipleKeyEvents(data: any) {
        if (!data || Object.keys(data).length < 2) {
            return;
        }

        const multipleKeyEvents = this.mediator.multipleKeyEvents;

        for (const eventName of multipleKeyEvents) {
            const requiredKeys = eventName.split(",").map((key) => key.trim());

            const hasAllKeys = requiredKeys.every((key) => data[key] !== undefined);
            if (hasAllKeys) {
                const eventData = requiredKeys.reduce((acc, key) => {
                    acc[key] = data[key];
                    return acc;
                }, {} as Record<string, any>);

                this.mediator.emit(eventName, eventData);
            }
        }
    }

    protected signIn() {
        const payload = new GameClientEmitMessage.Signin();
        const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
        payload.ss = sessionInfo?.session;
        payload.username = sessionInfo?.username;
        payload.system = sessionInfo?.system;

        this.send(GameClientEmitMessage.Signin.eventName, payload);
    }

    protected onSignedIn() {
        this.signedIn = true;
    }

    protected onConnectFailed(error?: Error) {
        this.isConnectFailed = true;
        this.isInstant() && this.postDisconnectMessage();
        this.handleConnectionStatus(false, error);
    }

    protected handleDisconnectionReason(reason = "") {
        if (this.isServerDisconnect(reason)) {
            this.isDisconnect = true;
            return;
        }

        if (this.shouldLogDisconnection(reason)) {
            this.isConnectFailed = true;
        }
    }

    protected handleConnectionStatus(connected: boolean, error?: Error) {
        this.isConnected = connected;
        this.signedIn = connected;
        this.connection.disconnect();
        error && this.logError(error);
        this.appStore.isLoading = false;
    }

    protected handleDisconnectInstant(reason: string | unknown) {
        if (this.shouldPostDisconnectMessage(reason)) {
            this.postDisconnectMessage();
        }
    }

    protected shouldPostDisconnectMessage(reason: string | unknown) {
        return this.isServerDisconnect(reason) || this.isTransportClose(reason);
    }

    protected isServerDisconnect(reason: string | unknown) {
        return reason === "io server disconnect";
    }

    protected isTransportClose(reason: string | unknown) {
        return reason === "transport close";
    }

    protected postDisconnectMessage() {
        BrowserDomUtils.postMessageToParent({ isDisconnect: true });
    }

    protected shouldLogDisconnection(reason: string | unknown) {
        return reason && reason !== "io client disconnect";
    }

    protected logError(reason: string | Error) {
        sentryLogger.logError(reason);
    }

    protected isInstant() {
        return this.authStore.system === AppTypes.Instant;
    }

    protected reset() {
        this.connection = null;
        this.isConnected = null;
        this.isConnectFailed = false;
        this.signedIn = false;
        this.isDisconnect = false;
    }
}
