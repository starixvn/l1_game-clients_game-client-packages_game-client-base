import { stub } from "jest-auto-stub";
import { AppStore } from "../../../../src/app/app-store";
import { AuthStore } from "../../../../src/auth/auth-store";
import { ConnectionStore, events } from "../../../../src/game/connection";
import { GameClientEmitMessage, Mediator } from "../../../../src/shared";
import { BrowserDomUtils, StorageManager, UrlUtils, sentryLogger } from "../../../../src/shared/utils";
import { gameSettings, siteConfigs } from "../../container.test";
import { AppTypes } from "./../../../../src/shared/constants/app-type";

jest.mock("../../../../src/shared/utils", () => ({
    StorageManager: { get: jest.fn() },
    localStorageKeys: { session: "" },
    sentryLogger: { logError: jest.fn() },
    UrlUtils: {
        buildServerUrl: jest.fn().mockReturnValue("socketUri"),
        getProxyRoute: jest.fn().mockReturnValue("/socket.io"),
    },
    BrowserDomUtils: { postMessageToParent: jest.fn() },
}));
jest.mock("mobx");
const optionsDefault = {
    path: "/socket.io",
    socketUri: "socketUri",
    transports: ["websocket"],
    upgrade: false,
    forceNew: true,
};
jest.mock("socket.io-client/dist/socket.io.js", () => ({
    io: jest.fn().mockReturnValue({}),
}));
jest.mock("socket.io-client/dist/socket.io.msgpack.min.js", () => ({
    io: jest.fn().mockReturnValue({}),
}));

describe("ConnectionStore tests", () => {
    let store: ConnectionStore;
    let mediator: Mediator;
    let authStore: AuthStore;
    let appStore: AppStore;
    beforeEach(() => {
        mediator = {
            emit: jest.fn(),
            multipleKeyEvents: [],
        } as any;
        authStore = stub<AuthStore>();
        appStore = stub<AppStore>();
        store = new ConnectionStore(mediator, gameSettings, siteConfigs, authStore, appStore);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("initConnection", () => {
        beforeEach(() => {
            // @ts-ignore
            store.reset = jest.fn();
            // @ts-ignore
            store.initBaseListener = jest.fn();
        });
        it("should call UrlUtils.buildServerUrl with expected arguments", () => {
            // act
            store.initConnection();

            // assert
            expect(UrlUtils.buildServerUrl).toHaveBeenCalledWith("http", siteConfigs.websocket.proxyPath, gameSettings.id, siteConfigs);
        });

        it("should call UrlUtils.getProxyRoute with expected arguments", () => {
            // act
            store.initConnection();

            // assert
            expect(UrlUtils.getProxyRoute).toHaveBeenCalledWith(siteConfigs);
        });
        it("should set connection", () => {
            // act
            store.initConnection();

            // assert
            expect(store.connection).toEqual({});
        });
        it("should call init base listener", () => {
            // act
            store.initConnection();

            // assert
            // @ts-ignore
            expect(store.initBaseListener).toHaveBeenCalled();
        });

        it("should call reset", () => {
            // act
            store.initConnection();

            // assert
            // @ts-ignore
            expect(store.reset).toHaveBeenCalled();
        });
    });

    describe("initBaseListener", () => {
        describe("when connection not null", () => {
            beforeEach(() => {
                store.connection = {
                    on: jest.fn().mockImplementation((event, handler) => {
                        store.connection[event] = handler;
                        return store.connection;
                    }),
                    onAny: jest.fn(),
                    emit: jest.fn(),
                } as any;
            });

            it("should init all required event listeners", () => {
                // act
                // @ts-ignore
                store.initBaseListener();

                // assert
                expect(store.connection.on).toHaveBeenCalledWith(events.connect, expect.any(Function));
                expect(store.connection.on).toHaveBeenCalledWith(events.signedIn, expect.any(Function));
                expect(store.connection.on).toHaveBeenCalledWith(events.connectError, expect.any(Function));
                expect(store.connection.on).toHaveBeenCalledWith(events.connectFailed, expect.any(Function));
                expect(store.connection.on).toHaveBeenCalledWith(events.disconnect, expect.any(Function));
            });

            it("should bind correct handlers to events", () => {
                // act
                // @ts-ignore
                store.initBaseListener();

                // assert
                const calls = store.connection.on.mock.calls;
                // @ts-ignore
                expect(calls.find((call) => call[0] === events.connect)[1].toString()).toBe(store.onConnected.bind(store).toString());
                // @ts-ignore
                expect(calls.find((call) => call[0] === events.signedIn)[1].toString()).toBe(store.onSignedIn.bind(store).toString());
                // @ts-ignore
                expect(calls.find((call) => call[0] === events.connectError)[1].toString()).toBe(
                    // @ts-ignore
                    store.onConnectFailed.bind(store).toString()
                );
                expect(calls.find((call) => call[0] === events.connectFailed)[1].toString()).toBe(
                    // @ts-ignore
                    store.onConnectFailed.bind(store).toString()
                );
                expect(calls.find((call) => call[0] === events.disconnect)[1].toString()).toBe(store.onDisconnected.bind(store).toString());
            });
        });

        describe("when connection is null", () => {
            beforeEach(() => {
                store.connection = null;
            });

            it("should not throw error", () => {
                // act & assert
                // @ts-ignore
                expect(() => store.initBaseListener()).not.toThrow();
            });
        });
    });

    describe("onConnected", () => {
        const sessionInfo = { session: "session", username: "username", system: 1 };
        beforeAll(() => {
            (StorageManager.get as jest.Mock).mockReturnValue(sessionInfo);
        });

        it("should set isConnected true", () => {
            // arrange
            store.connection = {};
            store.connection.onAny = jest.fn();
            store.connection.emit = jest.fn();

            // act
            // @ts-ignore
            store.onConnected();

            // assert
            expect(store.isConnected).toBe(true);
        });

        it("should set isConnectFailed false", () => {
            // arrange
            store.connection = {};
            store.connection.onAny = jest.fn();
            store.connection.emit = jest.fn();

            // act
            // @ts-ignore
            store.onConnected();

            // assert
            expect(store.isConnectFailed).toBe(false);
        });

        it("should call connection onAny", () => {
            // arrange
            store.connection = {};
            store.connection.onAny = jest.fn();
            store.connection.emit = jest.fn();

            // act
            // @ts-ignore
            store.onConnected();

            // assert
            // @ts-ignore
            expect(store.connection.onAny.mock.calls[0][0].toString()).toBe(store.onHandleData.bind(store).toString());
        });

        it("should call signin", () => {
            // arrange
            store.connection = {};
            store.connection.onAny = jest.fn();
            store.connection.emit = jest.fn();

            const payload = new GameClientEmitMessage.Signin();
            payload.ss = sessionInfo?.session;
            payload.username = sessionInfo?.username;
            payload.system = sessionInfo?.system;

            // act
            // @ts-ignore
            store.onConnected();

            // assert
            expect(store.connection.emit).toHaveBeenCalledWith(GameClientEmitMessage.Signin.eventName, payload);
        });
    });

    describe("onHandleData", () => {
        it("should call mediator emit with keys of payload when event equal game name", () => {
            // arrange
            const payload = { roundId: 1, remainingTime: 20 };

            // act
            // @ts-ignore
            store.onHandleData(gameSettings.name, payload);

            // assert
            expect(mediator.emit).toHaveBeenCalledTimes(2);
            expect((mediator.emit as jest.Mock).mock.calls[0][0]).toBe("roundId");
            expect((mediator.emit as jest.Mock).mock.calls[0][1]).toBe(1);
            expect((mediator.emit as jest.Mock).mock.calls[1][0]).toBe("remainingTime");
            expect((mediator.emit as jest.Mock).mock.calls[1][1]).toBe(20);
        });
        it("should call mediator emit with keys of payload when event is message", () => {
            // arrange
            const payload = { userStakeLevel: { minBet: 1, maxBet: 2000 } };

            // act
            // @ts-ignore
            store.onHandleData("message", payload);

            // assert
            expect(mediator.emit).toHaveBeenCalled();
            expect((mediator.emit as jest.Mock).mock.calls[0][0]).toBe("userStakeLevel");
            expect((mediator.emit as jest.Mock).mock.calls[0][1]).toEqual({ minBet: 1, maxBet: 2000 });
        });

        it("should call mediator emit with payload when event is not game name or message", () => {
            // arrange
            const payload = { value: 123 };

            // act
            // @ts-ignore
            store.onHandleData("test-event", payload);

            // assert
            expect(mediator.emit).toHaveBeenCalled();
            expect((mediator.emit as jest.Mock).mock.calls[0][0]).toBe("test-event");
            expect((mediator.emit as jest.Mock).mock.calls[0][1]).toEqual(payload);
        });
    });

    describe("onSignedIn", () => {
        it("should set signedIn is true", () => {
            // act
            // @ts-ignore
            store.onSignedIn();

            // assert
            expect(store.signedIn).toBe(true);
        });
    });

    describe("onConnectFailed", () => {
        beforeEach(() => {
            store.connection = {};
            store.connection.disconnect = jest.fn();
            // act
            // @ts-ignore
            store.onConnectFailed();
        });
        it("should set isConnectFailed is true", () => {
            // assert
            expect(store.isConnectFailed).toBe(true);
        });

        it("should set isConnected is false", () => {
            // assert
            expect(store.isConnected).toBe(false);
        });

        it("should set signedIn is false", () => {
            // assert
            expect(store.signedIn).toBe(false);
        });

        it("should call connection disconnect", () => {
            // assert
            expect(store.connection.disconnect).toHaveBeenCalled();
        });

        it("should log error", () => {
            // arrange
            const error = new Error("error");

            // act
            // @ts-ignore
            store.onConnectFailed(error);

            // assert
            expect(sentryLogger.logError).toHaveBeenCalledWith(error);
        });
    });

    describe("onDisconnected", () => {
        beforeEach(() => {
            store.connection = {};
            store.connection.disconnect = jest.fn();

            // act
            // @ts-ignore
            store.onDisconnected();
        });

        it("should set isConnected is false", () => {
            // assert
            expect(store.isConnected).toBe(false);
        });

        it("should set signedIn is false", () => {
            // assert
            expect(store.signedIn).toBe(false);
        });

        it("should call connection disconnect", () => {
            // assert
            expect(store.connection.disconnect).toHaveBeenCalled();
        });

        describe("when disconnect with reason is not from client", () => {
            it("should set isDisconnect is true", () => {
                // arrange
                const reason = "io server disconnect";

                // act
                store.onDisconnected(reason);

                // assert
                expect(store.isDisconnect).toBe(true);
            });

            it("should post isDisconnect = true to parent when system Instant", () => {
                // arrange
                const reason = "io server disconnect";
                authStore.system = AppTypes.Instant;

                // act
                store.onDisconnected(reason);

                // assert
                expect(BrowserDomUtils.postMessageToParent).toHaveBeenCalledWith({ isDisconnect: true });
            });
            it("should post isDisconnect = true to parent when system Instant", () => {
                // arrange
                const reason = "transport close";
                authStore.system = AppTypes.Instant;

                // act
                store.onDisconnected(reason);

                // assert
                expect(BrowserDomUtils.postMessageToParent).toHaveBeenCalledWith({ isDisconnect: true });
            });
        });

        describe("when disconnect with reason is from client", () => {
            it("should set isConnectFailed is false", () => {
                // arrange
                const reason = "io client disconnect";

                // act
                store.onDisconnected(reason);

                // assert
                expect(store.isConnectFailed).toBe(false);
            });
            it("should set isConnectFailed is false", () => {
                // act
                store.onDisconnected();

                // assert
                expect(store.isConnectFailed).toBe(false);
            });
        });
    });

    describe("reset", () => {
        beforeEach(() => {
            global.clearTimeout = jest.fn();
        });
        it("should reset all stores", () => {
            // arrange
            store.connection = {};
            store.isConnected = false;
            store.isConnected = true;
            store.signedIn = true;

            // act
            // @ts-ignore
            store.reset();

            // assert
            expect(store.connection).toBeNull();
            expect(store.isConnected).toBeNull();
            expect(store.isConnectFailed).toBe(false);
            expect(store.signedIn).toBe(false);
        });
    });
});
