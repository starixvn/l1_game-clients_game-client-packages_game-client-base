import { AppHandlers, AppStore } from "../../../src/app";
import { PlayerSelectionHandlers, PlayerSelectionStore } from "../../../src/game/player-selections";
import { BrowserDomUtils, GameUtils, StorageManager } from "../../../src/shared/utils";

jest.mock("../../../src/shared/utils");

describe("AppHandlers", () => {
    describe("BackToLobby", () => {
        let appStore: AppStore;
        let handler: AppHandlers.BackToOperatorLobby;

        beforeEach(() => {
            // arrange
            appStore = new AppStore();
            handler = new AppHandlers.BackToOperatorLobby(appStore, new PlayerSelectionHandlers.ClearHandlers(new PlayerSelectionStore()));
            appStore.urlInfo = { returnUrl: "rurl" };
            GameUtils.base64Decode = jest.fn().mockReturnValue("returnUrl");
            BrowserDomUtils.replaceParentLocation = jest.fn();
        });

        describe("when app store has return url", () => {
            const session = {
                isAuthenticated: true,
                session: "session",
                memberName: "",
                username: "",
                ssoTime: new Date("2023-01-01"),
                language: "en",
            };

            beforeEach(() => {
                // arrange
                StorageManager.get = jest.fn().mockReturnValueOnce(session);
            });

            describe("when is direct mode", () => {
                it("should call BrowserDomUtils.replaceParentLocation", () => {
                    // arrange
                    appStore.isDirectMode = true;

                    // act
                    handler.handle();

                    // assert
                    expect(BrowserDomUtils.replaceParentLocation).toHaveBeenCalledWith("returnUrl");
                });
            });

            describe("when is not direct mode", () => {
                beforeEach(() => {
                    // arrange
                    appStore.isDirectMode = false;
                });

                describe("when is standalone mode", () => {
                    beforeEach(() => {
                        // arrange
                        appStore.isStandalone = true;
                        appStore.currencyGroup = "EN";
                        global.window = Object.create(window);
                        Object.defineProperty(window, "location", {
                            value: { replace: jest.fn() },
                        });
                    });

                    it("should redirect to lobby with correct URL", () => {
                        // arrange
                        const expectedUrl = new URL("returnUrl/?session=session&gameId=0&cg=EN", "https://example.com");
                        GameUtils.base64Decode = jest.fn().mockReturnValue("https://example.com/returnUrl");

                        // act
                        handler.handle();

                        // assert
                        expect(window.location.replace).toHaveBeenCalledWith(expectedUrl);
                    });
                });

                describe("when is not standalone mode", () => {
                    beforeEach(() => {
                        // arrange
                        appStore.isStandalone = false;
                    });

                    it("should call BrowserDomUtils.postMessageToParent with correct params", () => {
                        // arrange
                        const expectedParams = {
                            isAuthenticated: true,
                            ss: "session",
                            memberName: "",
                            username: "",
                            language: "en",
                            time: 1672531200000,
                            backLobby: true,
                        };

                        // act
                        handler.handle();

                        // assert
                        expect(BrowserDomUtils.postMessageToParent).toHaveBeenCalledWith(expectedParams);
                    });
                });
            });

            it("should set isLoading true into app store", () => {
                // arrange
                appStore.isLoading = false;
                appStore.isDirectMode = true;

                // act
                handler.handle();

                // assert
                expect(appStore.isLoading).toBe(true);
            });
        });

        describe("when app store not has return url", () => {
            it("should not do anything", () => {
                // arrange
                BrowserDomUtils.replaceParentLocation = jest.fn();
                BrowserDomUtils.postMessageToParent = jest.fn();
                appStore.isLoading = false;
                appStore.urlInfo = {};

                // act
                handler.handle();

                // assert
                expect(appStore.isLoading).toBe(false);
                expect(BrowserDomUtils.replaceParentLocation).not.toHaveBeenCalled();
                expect(BrowserDomUtils.postMessageToParent).not.toHaveBeenCalled();
            });
        });
    });

    describe("UserGesturePage", () => {
        let userGesturePage: AppHandlers.UserGesturePage;
        let appStore: AppStore;

        beforeEach(() => {
            // arrange
            appStore = new AppStore();
            userGesturePage = new AppHandlers.UserGesturePage(appStore);
        });

        it("should update isUserGesture to true", () => {
            // act
            userGesturePage.handle(true);

            // assert
            expect(appStore.isUserGesture).toBe(true);
        });

        it("should update isUserGesture to false", () => {
            // act
            userGesturePage.handle(false);

            // assert
            expect(appStore.isUserGesture).toBe(false);
        });
    });
});
