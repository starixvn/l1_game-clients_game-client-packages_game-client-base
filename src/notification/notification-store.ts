import { inject, injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { Socket } from "socket.io-client/dist/socket.io.js";
import { Mediator, NotificationServiceMessage } from "../shared";
import { SocketEvents } from "../shared/constants/socket-event";
import { sentryLogger } from "../shared/utils/logger";

export const events = {
    ...SocketEvents,
    ...{
        kickedOut: "kickedOut",
        reload: "reload",
        jackpotWinner: "jackpotWinner",
        promotionNotifications: "promotionNotifications",
        boostedOddPromotion: "promotions",
    },
};

@injectable()
export class NotificationStore {
    constructor(@inject(Mediator) protected readonly mediator: Mediator) {
        makeAutoObservable(this);
    }

    connection: Socket = null;
    isConnected = false;
    isConnectFailed = false;

    initListener() {
        if (this.connection) {
            this.connection.on(events.connect, this.onConnected.bind(this));
            this.connection.on(events.connectError, this.onConnectFailed.bind(this));
            this.connection.on(events.connectFailed, this.onConnectFailed.bind(this));
            this.connection.on(events.disconnect, this.onDisconnected.bind(this));
        }
    }

    onConnected() {
        this.isConnected = true;
        this.isConnectFailed = false;

        this.connection.on(events.kickedOut, this.onHandleKickedOut.bind(this));
        this.connection.on(events.reload, this.onReload.bind(this));
        this.connection.on(events.jackpotWinner, this.onNotifyJackpotWinner.bind(this));
        this.connection.on(events.promotionNotifications, this.onPromotionNotification.bind(this));
        this.connection.on(events.boostedOddPromotion, this.onBoostedOddsPromotion.bind(this));
    }

    onHandleKickedOut(data: boolean | NotificationServiceMessage.UnderMaintenanceInfo) {
        if (typeof data === "boolean") {
            data && this.mediator.emit(NotificationServiceMessage.sessionTimeoutEventName);
        } else {
            this.mediator.emit(NotificationServiceMessage.UnderMaintenanceInfo.eventName, data);
        }
    }

    onReload() {
        this.mediator.emit(NotificationServiceMessage.reloadEventName);
    }

    onNotifyJackpotWinner(data: NotificationServiceMessage.JackpotWinner) {
        this.mediator.emit(NotificationServiceMessage.JackpotWinner.eventName, data);
    }

    onPromotionNotification(data: NotificationServiceMessage.PromotionNotifications) {
        this.mediator.emit(NotificationServiceMessage.PromotionNotifications.eventName, data);
    }

    onBoostedOddsPromotion(data: NotificationServiceMessage.BoostedOdd) {
        this.mediator.emit(NotificationServiceMessage.BoostedOdd.eventName, data);
    }

    onConnectFailed(error?: Error) {
        this.isConnectFailed = true;
        this.onDisconnected();
        error && sentryLogger.logError(error);
    }

    onDisconnected() {
        this.isConnected = false;
        this.connection.disconnect();
    }

    send(eventName: string, data?: any) {
        this.connection?.emit(eventName, data || {});
    }
}
