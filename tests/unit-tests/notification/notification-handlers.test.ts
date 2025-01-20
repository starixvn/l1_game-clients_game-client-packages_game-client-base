import { stub } from "jest-auto-stub";
import { io } from "socket.io-client/dist/socket.io.js";
import { io as ioMsgPack } from "socket.io-client/dist/socket.io.msgpack.min.js";
import { NotificationStore } from "../../../src/notification";
import { NotificationHandlers } from "../../../src/notification/notification-handlers";
import { NotificationServiceMessage } from "../../../src/shared";
import { UrlUtils } from "../../../src/shared/utils";
import { siteConfigs } from "../container.test";

jest.mock("../../../src/shared/utils/storage-manager", () => ({
    StorageManager: {
        get: jest.fn().mockReturnValue({
            ss: "sessionInfo.session",
            username: "username",
        }),
        remove: jest.fn(),
    },
    localStorageKeys: { session: "session-key" },
}));

jest.mock("../../../src/shared/utils", () => ({
    UrlUtils: {
        buildUrl: jest.fn().mockReturnValue("https://notification.com"),
        getSubDirectory: jest.fn().mockReturnValue(""),
    },
}));
jest.mock("socket.io-client/dist/socket.io.js", () => ({
    io: jest.fn().mockReturnValue({}),
}));
jest.mock("socket.io-client/dist/socket.io.msgpack.min.js", () => ({
    io: jest.fn().mockReturnValue({}),
}));
const fakeSession = {
    isAuthenticated: true,
    username: "username",
    language: "En",
    session: "abv",
    system: 1,
    ssoTime: new Date("May 19, 2023 03:24:00"),
    memberName: "membername",
};

describe("NotificationHandlers tests", () => {
    describe("handle", () => {
        let cloneSiteConfigs;
        let handler: NotificationHandlers.Connect;
        let notificationStore: NotificationStore;
        beforeEach(() => {
            cloneSiteConfigs = { ...siteConfigs };
            notificationStore = stub<NotificationStore>();
            handler = new NotificationHandlers.Connect(notificationStore, cloneSiteConfigs);
        });

        describe("when enableMsgpackParserOnNotification = true & isDev = true", () => {
            it("should call ioMsgPack with expected arguments ", () => {
                // arrange
                handler["siteConfigs"].enableMsgpackParserOnNotification = true;
                const notificationServiceUrlDev = "https://localhost:3008";
                handler["siteConfigs"].notificationServiceUrlDev = notificationServiceUrlDev;
                handler["siteConfigs"].isDev = true;
                (UrlUtils.getSubDirectory as jest.Mock).mockReturnValueOnce("");
                const options = {
                    path: "/socket.io",
                    socketUri: "https://localhost:3008",
                    transports: ["websocket"],
                    upgrade: false,
                    forceNew: true,
                    auth: {
                        ss: fakeSession.session,
                        username: fakeSession.username,
                    },
                };
                const connection = { msgpack: true };
                (ioMsgPack as jest.Mock).mockReturnValue(connection);

                // act
                handler.handle(fakeSession);

                // assert
                expect(ioMsgPack).toHaveBeenCalledWith(notificationServiceUrlDev, options);
                expect(notificationStore.connection).toEqual(connection);
                expect(notificationStore.initListener).toHaveBeenCalled();
            });
        });

        describe("when enableMsgpackParserOnNotification = false & isDev = false", () => {
            it("should call io with expected arguments ", () => {
                // arrange
                handler["siteConfigs"].enableMsgpackParserOnNotification = false;
                handler["siteConfigs"].isDev = false;
                (UrlUtils.getSubDirectory as jest.Mock).mockReturnValueOnce("uat/");
                const options = {
                    path: "/uat/notification/socket.io",
                    socketUri: "https://notification.com",
                    transports: ["websocket"],
                    upgrade: false,
                    forceNew: true,
                    auth: {
                        ss: fakeSession.session,
                        username: fakeSession.username,
                    },
                };
                const connection = { msgpack: false };
                (io as jest.Mock).mockReturnValue(connection);

                // act
                handler.handle(fakeSession);

                // assert
                expect(io).toHaveBeenCalledWith("https://notification.com", options);
                expect(notificationStore.connection).toEqual(connection);
                expect(notificationStore.initListener).toHaveBeenCalled();
            });
        });
    });

    describe("InitPromotionNotifications", () => {
        let handler: NotificationHandlers.InitPromotionNotifications;
        let notificationStore: NotificationStore;

        beforeEach(() => {
            notificationStore = stub<NotificationStore>();
            handler = new NotificationHandlers.InitPromotionNotifications(notificationStore);
        });

        describe("handle", () => {
            it("should call notificationStore.send with promotion notifications event name", () => {
                // act
                handler.handle();

                // assert
                expect(notificationStore.send).toHaveBeenCalledWith(NotificationServiceMessage.PromotionNotifications.eventName);
            });
        });
    });
});
