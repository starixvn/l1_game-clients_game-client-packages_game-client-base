import { stub } from "jest-auto-stub";
import { NotificationStore } from "../../../src/notification";
import { NotificationHandlers } from "../../../src/notification/notification-handlers";
import { NotificationServiceMessage } from "../../../src/shared";
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

        it("should call io with expected arguments ", () => {
            // arrange

            // act
            handler.handle(fakeSession);

            // assert
            expect(notificationStore.init).toHaveBeenCalled();
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
