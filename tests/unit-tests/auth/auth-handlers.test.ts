import { stub } from "jest-auto-stub";
import { AppStore } from "../../../src/app/app-store";
import { AuthHandlers, AuthStore, UserService } from "../../../src/auth";
import { SiteConfigs } from "../../../src/configs";
import { NotificationStore } from "../../../src/notification";
import { NotificationHandlers } from "../../../src/notification/notification-handlers";
import { MainPlayerStore } from "../../../src/players";
import { Mediator } from "../../../src/shared";

import { NoticeStore } from "../../../src/game/notices/notice-store";
import { PlayerSelectionHandlers } from "../../../src/game/player-selections";
import { BrowserDomUtils } from "../../../src/shared/utils/browser-dom-utils";
import { GameUtils } from "../../../src/shared/utils/game-utils";
import { Translator } from "../../../src/shared/utils/localization-manager";
import { sentryLogger } from "../../../src/shared/utils/logger";
import { NameGenerator } from "../../../src/shared/utils/name-generator";
import { StorageManager, localStorageKeys } from "../../../src/shared/utils/storage-manager";
import { siteConfigs } from "../container.test";

jest.mock("../../../src/shared/utils/game-utils");
jest.mock("../../../src/shared/utils/name-generator");
jest.mock("../../../src/shared/utils/browser-dom-utils");
jest.mock("../../../src/shared/utils/storage-manager", () => ({
    StorageManager: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
    },
    localStorageKeys: {
        session: "session-key",
        playerSetting: "setting-key",
        directMode: "directMode",
        returnUrl: "returnUrl",
        isApp: "app",
    },
}));
jest.mock("../../../src/shared/utils/logger", () => ({
    sentryLogger: { logError: jest.fn() },
}));
jest.mock("../../../src/shared/utils/localization-manager", () => ({
    Translator: { translate: jest.fn(), gameTranslate: jest.fn(), commonTranslate: jest.fn().mockImplementation((key, option) => key) },
}));

let notificationServiceHandler: NotificationHandlers.Connect;

describe("AuthHandlers tests", () => {
    beforeEach(() => {
        notificationServiceHandler = new NotificationHandlers.Connect(new NotificationStore(new Mediator()), new SiteConfigs());
    });

    describe("SignOut", () => {
        let appStore: AppStore;
        let authStore: AuthStore;
        let handler: AuthHandlers.SignOut;
        beforeEach(() => {
            appStore = stub<AppStore>();
            authStore = stub<AuthStore>();
            handler = new AuthHandlers.SignOut(appStore, authStore);
        });
        it("should call authStore.signOut", () => {
            // act
            handler.handle();

            // assert
            expect(authStore.signOut).toHaveBeenCalled();
        });

        it("should call appStore.setTimeOut", () => {
            // act
            handler.handle();

            // assert
            expect(appStore.setTimeOut).toHaveBeenCalled();
        });
    });

    describe("Authorize", () => {
        // arrange
        const userService = new UserService(siteConfigs);
        userService.authorize = jest.fn();
        const noticeStore = stub<NoticeStore>();
        describe("when UM", () => {
            const response = { isUM: true, umInfo: {} };
            beforeEach(() => {
                // @ts-ignore
                userService.authorize.mockReturnValueOnce(response);
            });
            it("should call userService authorize with session and username from storage manager", async () => {
                // arrange
                // @ts-ignore
                StorageManager.get.mockReturnValueOnce({ session: "session", username: "username" });
                const authStore = new AuthStore();
                const mainPlayerStore = new MainPlayerStore(noticeStore);
                const appStore = new AppStore();
                appStore.setUM = jest.fn();
                const signOutHandler = new AuthHandlers.SignOut(appStore, authStore);
                const handler = new AuthHandlers.Authorize(
                    noticeStore,
                    authStore,
                    appStore,
                    mainPlayerStore,
                    userService,
                    signOutHandler,
                    notificationServiceHandler
                );

                // act
                await handler.handle({});

                // assert
                expect(userService.authorize).toHaveBeenCalledWith("session", "username");
            });
            it("should call userService authorize with session and username from param", async () => {
                // arrange
                // @ts-ignore
                const authStore = new AuthStore();
                const mainPlayerStore = new MainPlayerStore(noticeStore);
                const appStore = new AppStore();
                appStore.setUM = jest.fn();
                const signOutHandler = new AuthHandlers.SignOut(appStore, authStore);

                const handler = new AuthHandlers.Authorize(
                    noticeStore,
                    authStore,
                    appStore,
                    mainPlayerStore,
                    userService,
                    signOutHandler,
                    notificationServiceHandler
                );

                // act
                await handler.handle({ session: "1", username: "name" });

                // assert
                expect(userService.authorize).toHaveBeenCalledWith("1", "name");
            });
            it("should set UM in auth store with session and username from storage manager", async () => {
                // arrange
                // @ts-ignore
                StorageManager.get.mockReturnValueOnce({ session: "session", username: "username" });
                const authStore = new AuthStore();
                const mainPlayerStore = new MainPlayerStore(noticeStore);
                const appStore = new AppStore();
                appStore.setUM = jest.fn();
                const signOutHandler = new AuthHandlers.SignOut(appStore, authStore);

                const handler = new AuthHandlers.Authorize(
                    noticeStore,
                    authStore,
                    appStore,
                    mainPlayerStore,
                    userService,
                    signOutHandler,
                    notificationServiceHandler
                );

                // act
                await handler.handle({});

                // assert
                expect(appStore.setUM).toHaveBeenCalledWith(response.umInfo);
            });
        });

        describe("when authorize unsuccessful", () => {
            const response = { isUM: false, umInfo: null, isSuccessful: false };
            beforeEach(() => {
                // @ts-ignore
                userService.authorize.mockReturnValueOnce(response);
            });
            it("should call signOut", async () => {
                // arrange
                const authStore = new AuthStore();
                const mainPlayerStore = new MainPlayerStore(noticeStore);
                const appStore = new AppStore();
                const signOutHandler = new AuthHandlers.SignOut(appStore, authStore);
                signOutHandler.handle = jest.fn();

                const handler = new AuthHandlers.Authorize(
                    noticeStore,
                    authStore,
                    appStore,
                    mainPlayerStore,
                    userService,
                    signOutHandler,
                    notificationServiceHandler
                );

                // act
                await handler.handle({ session: "session", username: "username" });

                // assert
                expect(signOutHandler.handle).toHaveBeenCalled();
            });
        });

        describe("when authorize successfully", () => {
            let noticeStore: NoticeStore;
            beforeEach(() => {
                // @ts-ignore

                StorageManager.get.mockReturnValueOnce({
                    ss: "sessionInfo.session",
                    username: "username",
                });
                noticeStore = stub<NoticeStore>();
            });
            describe("when auth store isDirectMode false", () => {
                const authStore = new AuthStore();
                const appStore = new AppStore();
                appStore.isDirectMode = false;
                it("should set isAuthorized", async () => {
                    // arrange
                    const response = { isUM: false, umInfo: null, isSuccessful: true, authorized: true };
                    // @ts-ignore
                    userService.authorize.mockReturnValueOnce(response);
                    const mainPlayerStore = new MainPlayerStore(noticeStore);
                    const signOutHandler = new AuthHandlers.SignOut(appStore, authStore);

                    const handler = new AuthHandlers.Authorize(
                        noticeStore,
                        authStore,
                        appStore,
                        mainPlayerStore,
                        userService,
                        signOutHandler,
                        notificationServiceHandler
                    );

                    // act
                    await handler.handle({ session: "session", username: "username" });

                    // assert
                    expect(authStore.isAuthorized).toBe(response.authorized);
                });
                it("should not set authorize store in player when user is null", async () => {
                    // arrange
                    const response = { isUM: false, umInfo: null, isSuccessful: true, authorized: false, user: null };
                    // @ts-ignore
                    userService.authorize.mockReturnValueOnce(response);
                    const mainPlayerStore = new MainPlayerStore(noticeStore);
                    mainPlayerStore.setAuthorizeStore = jest.fn();
                    const signOutHandler = new AuthHandlers.SignOut(appStore, authStore);

                    const handler = new AuthHandlers.Authorize(
                        noticeStore,
                        authStore,
                        appStore,
                        mainPlayerStore,
                        userService,
                        signOutHandler,
                        notificationServiceHandler
                    );

                    // act
                    await handler.handle({ session: "session", username: "username" });

                    // assert
                    expect(mainPlayerStore.setAuthorizeStore).not.toHaveBeenCalled();
                });
                it("should set authorize store in player when user is not null", async () => {
                    // arrange
                    const user = { UID: 1 };
                    const response = { isUM: false, umInfo: null, isSuccessful: true, authorized: true, user };
                    // @ts-ignore
                    userService.authorize.mockReturnValueOnce(response);
                    const mainPlayerStore = new MainPlayerStore(noticeStore);
                    mainPlayerStore.setAuthorizeStore = jest.fn();
                    const signOutHandler = new AuthHandlers.SignOut(appStore, authStore);

                    const handler = new AuthHandlers.Authorize(
                        noticeStore,
                        authStore,
                        appStore,
                        mainPlayerStore,
                        userService,
                        signOutHandler,
                        notificationServiceHandler
                    );

                    // act
                    await handler.handle({ session: "session", username: "username" });

                    // assert
                    expect(mainPlayerStore.setAuthorizeStore).toHaveBeenCalledWith(user);
                });

                it("should show sign-name when authorized equal false", async () => {
                    // arrange
                    const response = { isUM: false, umInfo: null, isSuccessful: true, authorized: false, user: null };
                    // @ts-ignore
                    userService.authorize.mockReturnValueOnce(response);
                    const mainPlayerStore = new MainPlayerStore(noticeStore);
                    mainPlayerStore.setAuthorizeStore = jest.fn();
                    const signOutHandler = new AuthHandlers.SignOut(appStore, authStore);

                    const handler = new AuthHandlers.Authorize(
                        noticeStore,
                        authStore,
                        appStore,
                        mainPlayerStore,
                        userService,
                        signOutHandler,
                        notificationServiceHandler
                    );

                    // act
                    await handler.handle({ session: "session", username: "username" });

                    // assert
                    expect(authStore.isShowSignName).toBeTruthy();
                });
            });

            describe("when auth store isDirectMode true", () => {
                beforeEach(() => {
                    NameGenerator.generateName = jest.fn().mockReturnValueOnce("autoGeneratedNickname");
                });
                it("should create auto nickname", async () => {
                    // arrange
                    const response = { isUM: false, umInfo: null, isSuccessful: true, authorized: false };
                    // @ts-ignore
                    userService.authorize.mockReturnValueOnce(response);
                    userService.signName = jest.fn().mockReturnValue({ authorized: true });
                    const authStore = new AuthStore();
                    const appStore = new AppStore();
                    appStore.isDirectMode = true;
                    appStore.isAutoCreateNickname = true;
                    const mainPlayerStore = new MainPlayerStore(noticeStore);
                    mainPlayerStore.setAuthorizeStore = jest.fn();
                    const signOutHandler = new AuthHandlers.SignOut(appStore, authStore);

                    const handler = new AuthHandlers.Authorize(
                        noticeStore,
                        authStore,
                        appStore,
                        mainPlayerStore,
                        userService,
                        signOutHandler,
                        notificationServiceHandler
                    );

                    // act
                    await handler.handle({ session: "session", username: "username" });

                    // assert
                    expect(userService.signName).toHaveBeenCalledWith("session", "username", "autoGeneratedNickname");
                });
                it("should set isAuthorized in authStore when create nickname successfully", async () => {
                    // arrange
                    const response = { isUM: false, umInfo: null, isSuccessful: true, authorized: false };
                    // @ts-ignore
                    userService.authorize.mockReturnValueOnce(response);
                    userService.signName = jest.fn().mockReturnValue({ authorized: true });
                    const authStore = new AuthStore();
                    const appStore = new AppStore();
                    appStore.isDirectMode = true;
                    appStore.isAutoCreateNickname = true;
                    const mainPlayerStore = new MainPlayerStore(noticeStore);
                    mainPlayerStore.setAuthorizeStore = jest.fn();
                    const signOutHandler = new AuthHandlers.SignOut(appStore, authStore);

                    const handler = new AuthHandlers.Authorize(
                        noticeStore,
                        authStore,
                        appStore,
                        mainPlayerStore,
                        userService,
                        signOutHandler,
                        notificationServiceHandler
                    );

                    // act
                    await handler.handle({ session: "session", username: "username" });

                    // assert
                    expect(authStore.isAuthorized).toBe(true);
                });
                it("should setAuthorizeStore in mainPlayerStore when create nickname successfully", async () => {
                    // arrange
                    const response = { isUM: false, umInfo: null, isSuccessful: true, authorized: false };
                    // @ts-ignore
                    userService.authorize.mockReturnValueOnce(response);
                    userService.signName = jest.fn().mockReturnValue({ authorized: true, user: { UID: 1 } });
                    const authStore = new AuthStore();
                    const appStore = new AppStore();
                    appStore.isDirectMode = true;
                    appStore.isAutoCreateNickname = true;
                    const mainPlayerStore = new MainPlayerStore(noticeStore);
                    mainPlayerStore.setAuthorizeStore = jest.fn();
                    const signOutHandler = new AuthHandlers.SignOut(appStore, authStore);

                    const handler = new AuthHandlers.Authorize(
                        noticeStore,
                        authStore,
                        appStore,
                        mainPlayerStore,
                        userService,
                        signOutHandler,
                        notificationServiceHandler
                    );

                    // act
                    await handler.handle({ session: "session", username: "username" });

                    // assert
                    expect(mainPlayerStore.setAuthorizeStore).toHaveBeenCalledWith({ UID: 1 });
                });

                it("should showErrorMessageSignName in SplashScreen when run with isDirectMode = true and signName failed", async () => {
                    // arrange
                    const response = { isUM: false, umInfo: null, isSuccessful: true, authorized: false };
                    // @ts-ignore
                    userService.authorize.mockReturnValueOnce(response);
                    userService.signName = jest.fn().mockReturnValue({ authorized: false });
                    const authStore = new AuthStore();
                    const appStore = new AppStore();
                    appStore.isDirectMode = true;
                    appStore.isAutoCreateNickname = true;
                    const mainPlayerStore = new MainPlayerStore(noticeStore);
                    mainPlayerStore.setAuthorizeStore = jest.fn();
                    const signOutHandler = new AuthHandlers.SignOut(appStore, authStore);
                    const handler = new AuthHandlers.Authorize(
                        noticeStore,
                        authStore,
                        appStore,
                        mainPlayerStore,
                        userService,
                        signOutHandler,
                        notificationServiceHandler
                    );

                    // act
                    await handler.handle({ session: "session", username: "username" });

                    // assert
                    expect(noticeStore.addNotice).toHaveBeenCalled();
                });
            });
        });
    });

    describe("ClearRecheckInInterval", () => {
        let reCheckIn: AuthHandlers.ReCheckIn;

        let authStore: AuthStore;
        let triggerRecheckIn: AuthHandlers.TriggerRecheckIn;
        let userService: UserService;
        let player: MainPlayerStore;
        let handler: AuthHandlers.ClearRecheckInInterval;
        let signOut: AuthHandlers.SignOut;
        let appStore: AppStore;
        let noticeStore: NoticeStore;

        beforeEach(() => {
            authStore = new AuthStore();
            appStore = new AppStore();
            userService = new UserService(siteConfigs);
            noticeStore = stub<NoticeStore>();
            player = new MainPlayerStore(noticeStore);
            signOut = new AuthHandlers.SignOut(appStore, authStore);
            authStore = stub<AuthStore>();
            reCheckIn = new AuthHandlers.ReCheckIn(authStore, player, userService, signOut);
            triggerRecheckIn = new AuthHandlers.TriggerRecheckIn(reCheckIn, signOut);
            handler = new AuthHandlers.ClearRecheckInInterval(triggerRecheckIn);
        });

        afterEach(() => {
            jest.clearAllTimers();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        test("handle clears interval and removes session from local storage", () => {
            const clearIntervalSpy = jest.spyOn(AuthHandlers.TriggerRecheckIn.prototype, "clearInterval");
            StorageManager.remove = jest.fn();
            handler.handle();

            expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
            expect(StorageManager.remove).toHaveBeenCalledWith(localStorageKeys.session);
        });
    });

    describe("SSO", () => {
        let authStore: AuthStore;
        let appStore: AppStore;
        let userService: UserService;
        let authorizeHandler: AuthHandlers.Authorize;
        let signOutHandler: AuthHandlers.SignOut;
        let ssoHandler: AuthHandlers.SSO;
        let playerSelectionClearHandler: PlayerSelectionHandlers.ClearHandlers;

        beforeEach(() => {
            authStore = stub<AuthStore>();
            appStore = stub<AppStore>();
            userService = stub<UserService>();
            authorizeHandler = stub<AuthHandlers.Authorize>();
            signOutHandler = stub<AuthHandlers.SignOut>();
            playerSelectionClearHandler = stub<PlayerSelectionHandlers.ClearHandlers>();
            ssoHandler = new AuthHandlers.SSO(
                authStore,
                appStore,
                userService,
                authorizeHandler,
                signOutHandler,
                playerSelectionClearHandler
            );
            Object.defineProperty(history, "pushState", { value: jest.fn(), writable: true });
            Object.defineProperty(window, "location", {
                value: {
                    href: "https://microsite-1/?token=a",
                },
                writable: true,
            });
        });
        afterEach(() => {
            jest.clearAllMocks();
        });

        describe("when invalid session", () => {
            it("should sign out when expired session", async () => {
                // arrange
                // @ts-ignore
                StorageManager.get.mockReturnValueOnce(undefined);

                // act
                await ssoHandler.handle(new URLSearchParams());

                // assert
                expect(signOutHandler.handle).toBeCalled();
            });

            it("should sign out when urlParams not has token or params", async () => {
                // arrange
                const urlParams = new URLSearchParams("param=1");
                const date = new Date();
                // @ts-ignore
                StorageManager.get.mockReturnValueOnce({ ssoTime: date.setMinutes(date.getMinutes - 30) });

                // act
                await ssoHandler.handle(urlParams);

                // assert
                expect(signOutHandler.handle).toBeCalled();
            });
        });

        describe("when url params has token", () => {
            beforeEach(() => {
                // @ts-ignore
                StorageManager.get.mockReturnValueOnce(undefined);
            });
            const urlParams = new URLSearchParams("token=a&appType=1");

            describe("when UM", () => {
                beforeEach(() => {
                    (userService.sso as jest.Mock).mockReturnValueOnce({ isUM: true, umInfo: {} });
                });
                it("should set UM into appStore", async () => {
                    // act
                    await ssoHandler.handle(urlParams);

                    // assert
                    expect(userService.sso).toHaveBeenCalledWith("a", 1);
                    expect(appStore.setUM).toHaveBeenCalledWith({});
                });

                it("should call BrowserDomUtils.postMessageToParent after sso", async () => {
                    // act
                    await ssoHandler.handle(urlParams);

                    // assert
                    expect(BrowserDomUtils.postMessageToParent).toHaveBeenCalledWith({ hasSSO: true });
                });
            });

            describe("when isAuthenticated true", () => {
                const response = {
                    isAuthenticated: true,
                    ss: "session",
                    username: "username",
                    language: "language",
                    system: 1,
                    memberName: "",
                    isUM: false,
                };
                beforeEach(() => {
                    // @ts-ignore
                    userService.sso.mockReturnValueOnce(response);
                    // @ts-ignore
                    authStore.getSessionInfo.mockReturnValueOnce({ session: response.ss });
                    // @ts-ignore
                    StorageManager.remove = jest.fn();
                });
                it("should set store into authStore", async () => {
                    // act
                    await ssoHandler.handle(urlParams);

                    // assert
                    expect(authStore.setAuthSSOStore).toHaveBeenCalledWith(response);
                });

                it("should clear old sso data in storage", async () => {
                    // act
                    await ssoHandler.handle(urlParams);

                    // assert
                    expect(StorageManager.remove).toHaveBeenCalledWith(localStorageKeys.session);
                    expect(StorageManager.remove).toHaveBeenCalledWith(localStorageKeys.directMode);
                    expect(StorageManager.remove).toHaveBeenCalledWith(localStorageKeys.returnUrl);
                    expect(StorageManager.remove).toHaveBeenCalledWith(localStorageKeys.isApp);
                });

                it("should save session info in storage", async () => {
                    // act
                    await ssoHandler.handle(urlParams);

                    // assert
                    expect(StorageManager.set).toHaveBeenCalledWith(localStorageKeys.session, { session: response.ss });
                });

                it("should save direct mode info in storage", async () => {
                    // arrange
                    appStore.isDirectMode = true;

                    // act
                    await ssoHandler.handle(urlParams);

                    // assert
                    expect(appStore.saveDirectModeInfo).toHaveBeenCalled();
                });

                it("should save app in storage", async () => {
                    // act
                    await ssoHandler.handle(urlParams);

                    // assert
                    expect(appStore.saveIsApp).toHaveBeenCalled();
                });

                it("should call authorize handler", async () => {
                    // act
                    await ssoHandler.handle(urlParams);

                    // assert
                    expect(authorizeHandler.handle).toHaveBeenCalledWith({ session: response.ss, username: response.username });
                });

                it("should call BrowserDomUtils.postMessageToParent after sso", async () => {
                    // act
                    await ssoHandler.handle(urlParams);

                    // assert
                    expect(BrowserDomUtils.postMessageToParent).toHaveBeenCalledWith({ hasSSO: true });
                });

                it("should clear query string on url", async () => {
                    // act
                    await ssoHandler.handle(urlParams);

                    // assert
                    expect(BrowserDomUtils.postMessageToParent).toHaveBeenCalledWith({ clearQueryStringOnUrl: true });
                    expect(history.pushState).toHaveBeenCalledWith(null, "", "https://microsite-1/");
                });
            });
        });

        describe("when url params has params", () => {
            const urlParams = new URLSearchParams("params=test");
            const decodedParams = "ss=session&uname=username&sfxEnable=false";
            beforeEach(() => {
                // @ts-ignore
                StorageManager.get.mockReturnValueOnce(undefined);
                // @ts-ignore
                GameUtils.base64Decode.mockReturnValueOnce(decodedParams);
                // @ts-ignore
                authStore.getSessionInfo.mockReturnValueOnce({ session: "session" });
            });

            it("should set store into auth store from url params", async () => {
                // arrange
                const urlSearchParams = new URLSearchParams(decodedParams);

                // act
                await ssoHandler.handle(urlParams);

                // assert
                expect(authStore.setAuthStoreFromUrlParam).toHaveBeenCalledWith(urlSearchParams);
            });

            it("should set url store into app store", async () => {
                // arrange
                const urlSearchParams = new URLSearchParams(decodedParams);

                // act
                await ssoHandler.handle(urlParams);

                // assert
                expect(appStore.setURLStore).toHaveBeenCalledWith(urlSearchParams);
            });

            it("should save session info in storage", async () => {
                // act
                await ssoHandler.handle(urlParams);

                // assert
                expect(StorageManager.set).toHaveBeenCalledWith(localStorageKeys.session, { session: "session" });
            });

            it("should save direct mode info in storage", async () => {
                // arrange
                appStore.isDirectMode = true;

                // act
                await ssoHandler.handle(urlParams);

                // assert
                expect(appStore.saveDirectModeInfo).toHaveBeenCalled();
            });

            it("should save sound settings in storage", async () => {
                // act
                await ssoHandler.handle(urlParams);

                // assert
                expect(StorageManager.set).toHaveBeenCalledWith(localStorageKeys.playerSetting, { musicEnable: true, sfxEnable: false });
            });

            it("should call authorize handler", async () => {
                // act
                await ssoHandler.handle(urlParams);

                // assert
                expect(authorizeHandler.handle).toHaveBeenCalledWith({ session: "session", username: "username" });
            });

            it("should clear query string on url", async () => {
                // act
                await ssoHandler.handle(urlParams);

                // assert
                expect(BrowserDomUtils.postMessageToParent).toHaveBeenCalledWith({ clearQueryStringOnUrl: true });
                expect(history.pushState).toHaveBeenCalledWith(null, "", "https://microsite-1/");
            });
        });

        describe("when url params empty", () => {
            const urlParams = new URLSearchParams();
            beforeEach(() => {
                // @ts-ignore
                StorageManager.get.mockReturnValueOnce({ ssoTime: new Date() });
            });
            it("should set authStore from storage", async () => {
                // arrange
                // @ts-ignore
                StorageManager.get.mockReturnValueOnce({ username: "name", language: "en" }).mockReturnValueOnce(undefined);

                // act
                await ssoHandler.handle(urlParams);

                // assert
                expect(authStore.setAuthStoreFromStorage).toHaveBeenCalledWith({ username: "name", language: "en" });
            });

            it("should load direct mode info in storage", async () => {
                // arrange
                // @ts-ignore
                StorageManager.get.mockReturnValueOnce(undefined).mockReturnValueOnce(undefined);

                // act
                await ssoHandler.handle(urlParams);

                // assert
                expect(appStore.loadDirectMode).toHaveBeenCalled();
            });

            it("should sign out when session info not exist", async () => {
                // arrange
                // @ts-ignore
                StorageManager.get.mockReturnValueOnce(undefined).mockReturnValueOnce(undefined);

                // act
                await ssoHandler.handle(urlParams);

                // assert
                expect(signOutHandler.handle).toHaveBeenCalled();
            });

            it("should call authorize when session info exist", async () => {
                // arrange
                (StorageManager.get as jest.Mock)
                    .mockReturnValueOnce({ session: "session", username: "username" })
                    .mockReturnValueOnce({ session: "session", username: "username" });

                // act
                await ssoHandler.handle(urlParams);

                // assert
                expect(authorizeHandler.handle).toHaveBeenCalledWith({ session: "session", username: "username" });
            });
        });

        describe("when has error", () => {
            const urlParams = new URLSearchParams("token=a&appType=1");
            const error = new Error("error");
            beforeEach(() => {
                (Translator.commonTranslate as jest.Mock).mockReturnValueOnce("connection lost when sso");
                (StorageManager.get as jest.Mock).mockReturnValueOnce(undefined);
                userService.sso = jest.fn().mockImplementationOnce(() => {
                    throw error;
                });
                authStore.ssoErrorMessage = "";
            });
            it("should set sso error message into authStore", async () => {
                // act
                await ssoHandler.handle(urlParams);

                // assert
                expect(authStore.ssoErrorMessage).toBe("connection lost when sso");
            });
            it("should log error", async () => {
                // act
                await ssoHandler.handle(urlParams);

                // assert
                expect(sentryLogger.logError).toHaveBeenCalledWith(error);
            });
        });
    });

    describe("handleSignName", () => {
        let authorize: AuthHandlers.Authorize;
        let authStore: AuthStore;
        let mainPlayerStore: MainPlayerStore;
        const userService = new UserService(siteConfigs);
        const noticeStore = stub<NoticeStore>();
        beforeEach(() => {
            authStore = new AuthStore();
            const appStore = new AppStore();
            mainPlayerStore = new MainPlayerStore(noticeStore);
            const signOutHandler = new AuthHandlers.SignOut(appStore, authStore);
            authorize = new AuthHandlers.Authorize(
                noticeStore,
                authStore,
                appStore,
                mainPlayerStore,
                userService,
                signOutHandler,
                notificationServiceHandler
            );
        });
        afterEach(() => {
            jest.clearAllMocks();
        });

        it("should set isShowSignName to false and call handleAuthorizedResponse when authorized", async () => {
            // Arrange
            const username = "test_username";
            const response = { authorized: true, user: { UID: 1 } };
            userService.signName = jest.fn().mockReturnValue(response);
            mainPlayerStore.setAuthorizeStore = jest.fn();

            // Act
            await authorize.handleSignName(username);

            // Assert
            expect(authStore.isShowSignName).toBe(false);
            expect(authStore.isAuthorized).toBe(true);
        });

        it("should call showErrorMessageSignName when not authorized", async () => {
            // Arrange
            const username = "test_username";
            const response = { authorized: false, errorCode: "2002" };
            userService.signName = jest.fn().mockReturnValue(response);

            // Act
            await authorize.handleSignName(username);

            // Assert
            expect(userService.signName).toHaveBeenCalledWith("", "", username);
            expect(noticeStore.addNotice).toHaveBeenCalled();
        });
    });
});
