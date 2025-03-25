import { stub } from "jest-auto-stub";
import { AppHandlers, AppStore } from "../../../src/app";
import { SiteConfigs } from "../../../src/configs/site-configs";
import { GameConfigurationStore } from "../../../src/game-configuration/game-configuration-store";
import { PlayerSelectionHandlers, PlayerSelectionStore } from "../../../src/game/player-selections";
import { BrowserDomUtils, GameUtils, StorageManager } from "../../../src/shared/utils";

jest.mock("../../../src/shared/utils");

describe("AppHandlers", () => {
    describe("BackToLobby", () => {
        let appStore: AppStore;
        let handler: AppHandlers.BackToOperatorLobby;
        let gameConfigurationStore: GameConfigurationStore;
        let siteConfigs: SiteConfigs;

        beforeEach(() => {
            // arrange
            appStore = new AppStore();
            gameConfigurationStore = new GameConfigurationStore();
            siteConfigs = stub<SiteConfigs>();
            handler = new AppHandlers.BackToOperatorLobby(
                appStore,
                new PlayerSelectionHandlers.ClearHandlers(new PlayerSelectionStore()),
                gameConfigurationStore,
                siteConfigs
            );
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

        describe("getUpdatedBaseUrl", () => {
            beforeEach(() => {
                gameConfigurationStore.setGameConfiguration([
                    { id: 123, isMicrosite: true, name: "game1", key: "game1" },
                    { id: 456, name: "game2", key: "game2" },
                ]);
            });
            it("should return original baseUrl when gameId is not provided", () => {
                // arrange
                const baseUrl = "https://example.com/lobby";
                jest.spyOn(handler as any, "getDecodedReturnUrl").mockReturnValue(baseUrl);

                // act
                const result = (handler as any).getUpdatedBaseUrl();

                // assert
                expect(result).toBe(baseUrl);
            });

            it("should return original baseUrl when gameConfiguration is not available", () => {
                // arrange
                const baseUrl = "https://example.com/lobby";
                jest.spyOn(handler as any, "getDecodedReturnUrl").mockReturnValue(baseUrl);
                gameConfigurationStore.setGameConfiguration([]);

                // act
                const result = (handler as any).getUpdatedBaseUrl(123);

                // assert
                expect(result).toBe(baseUrl);
            });

            it("should return original baseUrl when game is not a microsite", () => {
                // arrange
                const baseUrl = "https://example.com/lobby";
                jest.spyOn(handler as any, "getDecodedReturnUrl").mockReturnValue(baseUrl);

                // act
                const result = (handler as any).getUpdatedBaseUrl(456);

                // assert
                expect(result).toBe(baseUrl);
            });
        });

        describe("navigateBasedOnMode", () => {
            beforeEach(() => {
                // mock all
                (handler as any).handleDirectModeNavigation = jest.fn();
                (handler as any).handleStandaloneNavigation = jest.fn();
                (handler as any).handleIframeNavigation = jest.fn();
            });

            it("should call handleDirectModeNavigation when isDirectMode is true", () => {
                // arrange
                appStore.isDirectMode = true;
                appStore.isStandalone = false;

                // act
                (handler as any).navigateBasedOnMode();

                // assert
                expect((handler as any).handleDirectModeNavigation).toHaveBeenCalled();
                expect((handler as any).handleStandaloneNavigation).not.toHaveBeenCalled();
                expect((handler as any).handleIframeNavigation).not.toHaveBeenCalled();
            });

            it("should call handleStandaloneNavigation when isStandalone is true and isDirectMode is false", () => {
                // arrange
                appStore.isDirectMode = false;
                appStore.isStandalone = true;

                // act
                (handler as any).navigateBasedOnMode();

                // assert
                expect((handler as any).handleDirectModeNavigation).not.toHaveBeenCalled();
                expect((handler as any).handleStandaloneNavigation).toHaveBeenCalledWith(0, 123);
                expect((handler as any).handleIframeNavigation).not.toHaveBeenCalled();
            });

            it("should call handleIframeNavigation when both isDirectMode and isStandalone are false", () => {
                // arrange
                appStore.isDirectMode = false;
                appStore.isStandalone = false;

                // act
                (handler as any).navigateBasedOnMode();

                // assert
                expect((handler as any).handleDirectModeNavigation).not.toHaveBeenCalled();
                expect((handler as any).handleStandaloneNavigation).not.toHaveBeenCalled();
                expect((handler as any).handleIframeNavigation).toHaveBeenCalled();
            });

            it("should prioritize isDirectMode over isStandalone when both are true", () => {
                // arrange
                appStore.isDirectMode = true;
                appStore.isStandalone = true;

                // act
                (handler as any).navigateBasedOnMode();

                // assert
                expect((handler as any).handleDirectModeNavigation).toHaveBeenCalled();
                expect((handler as any).handleStandaloneNavigation).not.toHaveBeenCalled();
                expect((handler as any).handleIframeNavigation).not.toHaveBeenCalled();
            });
        });

        describe("redirectWithEncodedParams", () => {
            it("should redirect to URL with base64 encoded params", () => {
                // Save original window.location
                const originalLocation = window.location;
                const locationReplaceMock = jest.fn();

                // Mock window.location
                Object.defineProperty(window, "location", {
                    configurable: true,
                    value: { ...originalLocation, replace: locationReplaceMock },
                });

                // Mock GameUtils.base64Encode
                const originalBase64Encode = GameUtils.base64Encode;
                GameUtils.base64Encode = jest.fn().mockReturnValue("encodedParamsString");

                try {
                    // Arrange
                    const baseUrl = "https://example.com";
                    const params = {
                        gameId: "123",
                        lang: "en",
                        cg: "USD",
                        isUserGesture: true,
                        undefinedParam: undefined,
                    };

                    // Act
                    (handler as any).redirectWithEncodedParams(baseUrl, params);

                    // Assert
                    expect(GameUtils.base64Encode).toHaveBeenCalled();
                    const base64EncodeCall = (GameUtils.base64Encode as jest.Mock).mock.calls[0][0];
                    expect(base64EncodeCall).toContain("gameId=123");
                    expect(base64EncodeCall).toContain("lang=en");
                    expect(base64EncodeCall).toContain("cg=USD");
                    expect(base64EncodeCall).toContain("isUserGesture=true");
                    expect(base64EncodeCall).not.toContain("undefinedParam");
                } finally {
                    // Restore original implementation
                    Object.defineProperty(window, "location", {
                        configurable: true,
                        value: originalLocation,
                    });
                    GameUtils.base64Encode = originalBase64Encode;
                }
            });
        });

        describe("redirectWithUrlParams", () => {
            it("should redirect to URL with main params in URL and other params base64 encoded", () => {
                // Save original window.location
                const originalLocation = window.location;
                const locationReplaceMock = jest.fn();

                // Mock window.location
                Object.defineProperty(window, "location", {
                    configurable: true,
                    value: { ...originalLocation, replace: locationReplaceMock },
                });

                // Mock URL and URLSearchParams
                const appendMock = jest.fn();
                const mockUrl = {
                    searchParams: {
                        append: appendMock,
                    },
                };
                const originalURL = global.URL;
                global.URL = jest.fn().mockImplementation(() => mockUrl) as any;

                // Mock GameUtils.base64Encode
                const originalBase64Encode = GameUtils.base64Encode;
                GameUtils.base64Encode = jest.fn().mockReturnValue("encodedOtherParams");

                try {
                    // Arrange
                    const baseUrl = "https://example.com";
                    const mainParams = {
                        gameId: "123",
                        lang: "en",
                        cg: "USD",
                    };
                    const otherParams = {
                        musicEnable: true,
                        sfxEnable: false,
                        isUserGesture: true,
                    };

                    // Act
                    (handler as any).redirectWithUrlParams(baseUrl, mainParams, otherParams);

                    // Assert
                    // Check URL constructor was called with baseUrl
                    expect(global.URL).toHaveBeenCalledWith(baseUrl);

                    // Check main params were appended to URL
                    expect(appendMock).toHaveBeenCalledWith("gameId", "123");
                    expect(appendMock).toHaveBeenCalledWith("lang", "en");
                    expect(appendMock).toHaveBeenCalledWith("cg", "USD");

                    // Check other params were encoded and appended
                    expect(GameUtils.base64Encode).toHaveBeenCalledWith(JSON.stringify(otherParams));
                    expect(appendMock).toHaveBeenCalledWith("params", "encodedOtherParams");

                    // Check window.location.replace was called
                    expect(locationReplaceMock).toHaveBeenCalled();
                } finally {
                    // Restore original implementations
                    Object.defineProperty(window, "location", {
                        configurable: true,
                        value: originalLocation,
                    });
                    GameUtils.base64Encode = originalBase64Encode;
                    global.URL = originalURL;
                }
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
