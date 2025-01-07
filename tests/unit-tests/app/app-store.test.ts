import { makeAutoObservable } from "mobx";
import { UMInfo } from "sc-user-service-client/dist/auth";
import { AppStore } from "../../../src/app/app-store";
import { BrowserDomUtils, StorageManager, localStorageKeys } from "../../../src/shared/utils";

jest.mock("../../../src/shared/utils", () => ({
    StorageManager: {
        get: jest.fn(),
        set: jest.fn(),
    },
    localStorageKeys: { session: "session-key", directMode: "d-key", returnUrl: "r-key", parentUrl: "p-url", isApp: "app" },
    GameUtils: { base64Decode: jest.fn() },
    BrowserDomUtils: { postMessageToParent: jest.fn() },
}));
jest.mock("mobx");
describe("appStore tests", () => {
    describe("constructor", () => {
        it("should call makeAutoObservable", () => {
            // act
            const store = new AppStore();

            // assert
            expect(makeAutoObservable).toHaveBeenCalledWith(store);
        });

        it("store has default value as expected", () => {
            // act
            const store = new AppStore();

            // assert
            expect(store.isUM).toBe(false);
            expect(store.umInfo).toBeNull();
            expect(store.isSessionTimeout).toBe(false);
            expect(store.isDirectMode).toBe(false);
            expect(store.isApp).toBe(false);
            expect(store.isPlayForFun).toBe(false);
            expect(store.urlInfo).toEqual({});
            expect(store.isAutoCreateNickname).toBe(false);
            expect(store.isLoading).toBe(true);
        });
    });
    describe("setUM", () => {
        it("should set isUM true", () => {
            // arrange
            const store = new AppStore();
            const umInfo: UMInfo = { startTime: new Date(1000), endTime: new Date(2000), operatorId: "" };

            // act
            store.setUM(umInfo);

            // assert
            expect(store.isUM).toBe(true);
        });

        it("should set umInfo", () => {
            // arrange
            const store = new AppStore();
            const umInfo: UMInfo = { startTime: new Date(1000), endTime: new Date(2000), operatorId: "" };

            // act
            store.setUM(umInfo);

            // assert
            expect(store.umInfo).toEqual(umInfo);
        });

        it("should post umInfo to parent", () => {
            // arrange
            const store = new AppStore();
            const umInfo: UMInfo = { startTime: new Date(1000), endTime: new Date(2000), operatorId: "" };

            // act
            store.setUM(umInfo);

            // assert
            expect(BrowserDomUtils.postMessageToParent).toHaveBeenCalledWith({ isUnderMaintain: true, umInfo });
        });
    });

    describe("setURLStore", () => {
        describe("when url params has ref", () => {
            it("should set isDirectMode true when ref is d_direct", () => {
                // arrange
                const urlParams = new URLSearchParams("ref=d_direct");
                const store = new AppStore();

                // act
                store.setURLStore(urlParams);

                // assert
                expect(store.isDirectMode).toBe(true);
                expect(store.urlInfo.ref).toEqual("d_direct");
            });

            it("should set isDirectMode true when ref is m_direct", () => {
                // arrange
                const urlParams = new URLSearchParams("ref=m_direct");
                const store = new AppStore();

                // act
                store.setURLStore(urlParams);

                // assert
                expect(store.isDirectMode).toBe(true);
                expect(store.urlInfo.ref).toEqual("m_direct");
            });

            it("should set isPlayForFun true when ref is d_operator_opendirectly", () => {
                // arrange
                const urlParams = new URLSearchParams("ref=d_operator_opendirectly");
                const store = new AppStore();

                // act
                store.setURLStore(urlParams);

                // assert
                expect(store.isPlayForFun).toBe(true);
                expect(store.urlInfo.ref).toEqual("d_operator_opendirectly");
            });

            it("should set isPlayForFun true when ref is m_operator_opendirectly", () => {
                // arrange
                const urlParams = new URLSearchParams("ref=m_operator_opendirectly");
                const store = new AppStore();

                // act
                store.setURLStore(urlParams);

                // assert
                expect(store.isPlayForFun).toBe(true);
                expect(store.urlInfo.ref).toEqual("m_operator_opendirectly");
            });

            it("should not set isPlayForFun and isDirectMode when ref is invalid", () => {
                // arrange
                const urlParams = new URLSearchParams("ref=asd");
                const store = new AppStore();

                // act
                store.setURLStore(urlParams);

                // assert
                expect(store.isPlayForFun).toBe(false);
                expect(store.isDirectMode).toBe(false);
            });

            it("should store parent URL into StorageManager", () => {
                // arrange
                const urlParams = new URLSearchParams("purl=OWdnwgucWH");
                const store = new AppStore();

                // act
                store.setURLStore(urlParams);

                // assert
                expect(StorageManager.set).toHaveBeenCalledWith(localStorageKeys.parentUrl, "OWdnwgucWH");
            });

            it("should set isUserGesture when isUserGesture is true ", () => {
                // arrange
                const urlParams = new URLSearchParams("isUserGesture=true");
                const store = new AppStore();

                // act
                store.setURLStore(urlParams);

                // assert
                expect(store.isUserGesture).toBe(true);
            });

            it("should set isUserGesture when isUserGesture is false ", () => {
                // arrange
                const urlParams = new URLSearchParams("isUserGesture=false");
                const store = new AppStore();

                // act
                store.setURLStore(urlParams);

                // assert
                expect(store.isUserGesture).toBe(false);
            });
        });
    });

    describe("saveDirectModeInfo", () => {
        it("should set direct mode info into storage manager", () => {
            // arrange
            // @ts-ignore
            StorageManager.get.mockReturnValueOnce({ session: "ss" });
            const store = new AppStore();
            store.isDirectMode = true;
            store.urlInfo = {};
            const data = {
                session: "ss",
                isDirectMode: store.isDirectMode,
                urlInfo: store.urlInfo,
            };

            // act
            store.saveDirectModeInfo();

            // assert
            expect(StorageManager.set).toHaveBeenCalledWith(localStorageKeys.directMode, data);
        });
    });

    describe("saveReturnUrl", () => {
        it("should set returnUrl into storage manager", () => {
            // arrange
            const store = new AppStore();
            store.urlInfo = { returnUrl: "rurl" };

            // act
            store.saveReturnUrl();

            // assert
            expect(StorageManager.set).toHaveBeenCalledWith(localStorageKeys.returnUrl, "rurl");
        });
    });

    describe("loadDirectMode", () => {
        it("should set store when storage manager has data and session equal", () => {
            // arrange
            const store = new AppStore();
            const directModeInfo = {
                session: "session",
                isDirectMode: true,
                urlInfo: { returnUrl: "rurl" },
            };
            // @ts-ignore
            StorageManager.get.mockReturnValueOnce(directModeInfo).mockReturnValueOnce({ session: "session" });

            // act
            store.loadDirectMode();

            // assert
            expect(store.isDirectMode).toBe(directModeInfo.isDirectMode);
            expect(store.urlInfo).toEqual(directModeInfo.urlInfo);
        });

        it("should not set store when storage manager has data and session not equal", () => {
            // arrange
            const store = new AppStore();
            const directModeInfo = {
                session: "session",
                isDirectMode: true,
                urlInfo: { returnUrl: "rurl" },
            };
            // @ts-ignore
            StorageManager.get.mockReturnValueOnce(directModeInfo).mockReturnValueOnce({ session: "session2" });

            // act
            store.loadDirectMode();

            // assert
            expect(store.isDirectMode).toBe(false);
            expect(store.urlInfo).toEqual({});
        });

        it("should not set store when storage manager has no data", () => {
            // arrange
            const store = new AppStore();
            // @ts-ignore
            StorageManager.get.mockReturnValueOnce(undefined);

            // act
            store.loadDirectMode();

            // assert
            expect(store.isDirectMode).toBe(false);
            expect(store.urlInfo).toEqual({});
        });
    });

    describe("loadReturnUrlAnd", () => {
        it("should set returnUrl when storage manager has return url", () => {
            // arrange
            const store = new AppStore();
            // @ts-ignore
            StorageManager.get.mockReturnValueOnce("rurl");

            // act
            store.loadReturnUrlAnd();

            // assert
            expect(store.urlInfo.returnUrl).toEqual("rurl");
        });
    });

    describe("setTimeOut", () => {
        let store: AppStore;
        beforeEach(() => {
            store = new AppStore();
        });
        it("should set isSessionTimeout true", () => {
            // arrange
            store.isSessionTimeout = false;

            // act
            store.setTimeOut();

            // assert
            expect(store.isSessionTimeout).toBe(true);
        });

        it("should call BrowserDomUtils.postMessageToParent", () => {
            // act
            store.setTimeOut();

            // assert
            expect(BrowserDomUtils.postMessageToParent).toHaveBeenCalledWith({ sessionTimeout: true });
        });
    });

    describe("saveIsApp", () => {
        let store: AppStore;
        beforeEach(() => {
            store = new AppStore();
        });
        it("should set data into storage when isApp=true", () => {
            // arrange
            store.isApp = true;

            // act
            store.saveIsApp();

            // assert
            expect(StorageManager.set).toHaveBeenCalledWith(localStorageKeys.isApp, "true");
        });

        it("should not set data into storage when isApp=false", () => {
            // arrange
            store.isApp = true;

            // act
            store.saveIsApp();

            // assert
            expect(StorageManager.set).toHaveBeenCalledWith(localStorageKeys.isApp, "true");
        });
    });

    describe("loadApp", () => {
        it("should load app from StorageManager", () => {
            // arrange
            const store = new AppStore();
            store.isApp = false;
            (StorageManager.get as jest.Mock).mockReturnValueOnce("true");

            // act
            store.loadApp();

            // assert
            expect(store.isApp).toBe(true);
        });
    });
});
