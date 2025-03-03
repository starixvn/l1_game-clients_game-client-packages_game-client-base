import { stub } from "jest-auto-stub";
import { io } from "socket.io-client/dist/socket.io.js";
import { io as ioMsgPack } from "socket.io-client/dist/socket.io.msgpack.min.js";
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
            store.reset = jest.fn();
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
            expect(store.initBaseListener).toHaveBeenCalled();
        });

        it("should call reset", () => {
            // act
            store.initConnection();

            // assert
            expect(store.reset).toHaveBeenCalled();
        });

        describe("when enableMsgpackParserAllGames = true", () => {
            it("should call ioMsgpack with expected arguments", () => {
                // arrange
                store["siteConfigs"].enableMsgpackParserAllGames = true;

                // act
                store.initConnection();

                // assert
                expect(ioMsgPack).toHaveBeenCalledWith("socketUri", optionsDefault);
            });
        });
        describe("when enableMsgpackParserAllGames = false", () => {
            it("should call ioMsgpack with expected arguments", () => {
                // arrange
                store["siteConfigs"].enableMsgpackParserAllGames = false;

                // act
                store.initConnection();

                // assert
                expect(io).toHaveBeenCalledWith("socketUri", optionsDefault);
            });
        });
    });

    describe("initBaseListener", () => {
        describe("when connection not null", () => {
            beforeEach(() => {
                store.connection = {
                    on: jest.fn().mockImplementation((event, handler) => {
                        // Store the handler for later use
                        store.connection[event] = handler;
                        return store.connection;
                    }),
                    onAny: jest.fn(),
                    emit: jest.fn(),
                } as any;

                // Add mock for setTimeout and clearTimeout
                jest.useFakeTimers();
                jest.spyOn(global, "clearTimeout");
            });

            afterEach(() => {
                jest.useRealTimers();
                jest.clearAllMocks();
            });

            describe("when isDirectModeOrPortrait is false", () => {
                beforeEach(() => {
                    authStore.system = AppTypes.Club;
                    appStore.isPortraitMode = false;
                });

                it("should init listeners onConnected", () => {
                    // act
                    store.initBaseListener();

                    // assert
                    expect(store.connection.on).toHaveBeenCalled();
                    expect(store.connection.on.mock.calls[0][0]).toBe(events.connect);
                    expect(store.connection.on.mock.calls[0][1].toString()).toBe(store.onConnected.bind(store).toString());
                });
            });

            describe("when isDirectModeOrPortrait is true", () => {
                beforeEach(() => {
                    // Mock either MobileDirect or PortraitMode
                    authStore.system = AppTypes.MobileDirect;
                    // or
                    // appStore.isPortraitMode = true;
                });

                it("should set timeout and handle connect with timeout clear", () => {
                    // act
                    store.initBaseListener();

                    // Get the connect handler
                    const connectHandler = store.connection.on.mock.calls.find((call) => call[0] === events.connect)[1];

                    // Call the connect handler
                    connectHandler();

                    // assert
                    expect(clearTimeout).toHaveBeenCalledWith(store.mobileDirConnectionTimeout);
                });

                it("should call onConnectFailed when timeout expires", () => {
                    // arrange
                    store.onConnectFailed = jest.fn();
                    store.isConnected = false;

                    // act
                    store.initBaseListener();

                    // Fast-forward timer
                    jest.advanceTimersByTime(store.DEFAULT_MOBILE_DIRECT_TIMEOUT_MS);

                    // assert
                    expect(store.onConnectFailed).toHaveBeenCalled();
                });

                it("should not call onConnectFailed if already connected", () => {
                    // arrange
                    store.onConnectFailed = jest.fn();
                    store.isConnected = true;

                    // act
                    store.initBaseListener();

                    // Fast-forward timer
                    jest.advanceTimersByTime(store.DEFAULT_MOBILE_DIRECT_TIMEOUT_MS);

                    // assert
                    expect(store.onConnectFailed).not.toHaveBeenCalled();
                });
            });

            it("should init listeners onSignedIn", () => {
                // act
                store.initBaseListener();

                // assert
                expect(store.connection.on).toHaveBeenCalledWith(events.signedIn, expect.any(Function));
            });

            it("should init listeners for error events", () => {
                // act
                store.initBaseListener();

                // assert
                expect(store.connection.on).toHaveBeenCalledWith(events.connectError, expect.any(Function));
                expect(store.connection.on).toHaveBeenCalledWith(events.connectFailed, expect.any(Function));
            });

            it("should init listeners for disconnect", () => {
                // act
                store.initBaseListener();

                // assert
                expect(store.connection.on).toHaveBeenCalledWith(events.disconnect, expect.any(Function));
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
            store.onConnected();

            // assert
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
            store.onSignedIn();

            // assert
            expect(store.signedIn).toBe(true);
        });
    });

    describe("onConnectFailed", () => {
        beforeEach(() => {
            store.connection = {};
            store.connection.disconnect = jest.fn();
        });
        it("should set isConnectFailed is true", () => {
            // act
            store.onConnectFailed();

            // assert
            expect(store.isConnectFailed).toBe(true);
        });

        it("should set isConnected is false", () => {
            // act
            store.onConnectFailed();

            // assert
            expect(store.isConnected).toBe(false);
        });

        it("should set signedIn is false", () => {
            // act
            store.onConnectFailed();

            // assert
            expect(store.signedIn).toBe(false);
        });

        it("should call connection disconnect", () => {
            // act
            store.onConnectFailed();

            // assert
            expect(store.connection.disconnect).toHaveBeenCalled();
        });

        it("should log error", () => {
            // arrange
            const error = new Error("error");

            // act
            store.onConnectFailed(error);

            // assert
            expect(sentryLogger.logError).toHaveBeenCalledWith(error);
        });
    });

    describe("onDisconnected", () => {
        beforeEach(() => {
            store.connection = {};
            store.connection.disconnect = jest.fn();
        });

        it("should set isConnected is false", () => {
            // act
            store.onDisconnected();

            // assert
            expect(store.isConnected).toBe(false);
        });

        it("should set signedIn is false", () => {
            // act
            store.onDisconnected();

            // assert
            expect(store.signedIn).toBe(false);
        });

        it("should call connection disconnect", () => {
            // act
            store.onDisconnected();

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
            store.reset();

            // assert
            expect(store.connection).toBeNull();
            expect(store.isConnected).toBeNull();
            expect(store.isConnectFailed).toBe(false);
            expect(store.signedIn).toBe(false);
        });
    });

    describe("isDirectModeOrPortrait", () => {
        it("should return true when system is MobileDirect", () => {
            // Arrange
            authStore.system = AppTypes.MobileDirect;
            appStore.isPortraitMode = false;

            // Act & Assert
            expect(store["isDirectModeOrPortrait"]()).toBe(true);
        });

        it("should return true when isPortraitMode is true", () => {
            // Arrange
            authStore.system = AppTypes.Club;
            appStore.isPortraitMode = true;

            // Act & Assert
            expect(store["isDirectModeOrPortrait"]()).toBe(true);
        });

        it("should return true when both MobileDirect and isPortraitMode are true", () => {
            // Arrange
            authStore.system = AppTypes.MobileDirect;
            appStore.isPortraitMode = true;

            // Act & Assert
            expect(store["isDirectModeOrPortrait"]()).toBe(true);
        });

        it("should return false when neither MobileDirect nor isPortraitMode", () => {
            // Arrange
            authStore.system = AppTypes.Club;
            appStore.isPortraitMode = false;

            // Act & Assert
            expect(store["isDirectModeOrPortrait"]()).toBe(false);
        });
    });
});
