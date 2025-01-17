import { stub } from "jest-auto-stub";
import { AppStore } from "../../../../src/app";
import { AuthStore } from "../../../../src/auth";
import { SiteConfigs } from "../../../../src/configs";
import { AppTypes } from "../../../../src/exports";
import { BaseBoostedOddsModel, BoostedOddsModel, BoostedOddsStore, PromotionModel } from "../../../../src/notification";
import { BoostedOddsPromotionsHandlers } from "../../../../src/notification/boosted-odds/boosted-odds-handlers";
import { MainPlayerStore } from "../../../../src/players";
import { StorageManager } from "../../../../src/shared/utils/storage-manager";

describe("Booted Odds tests", () => {
    describe("PromotionHelperHandlers", () => {
        let mockedMainPlayerStore: MainPlayerStore;
        let promotionHelperHandlers: BoostedOddsPromotionsHandlers.PromotionHelperHandlers;
        const authStore = stub<AuthStore>();

        beforeEach(() => {
            jest.clearAllMocks();
            mockedMainPlayerStore = stub<MainPlayerStore>();
            promotionHelperHandlers = new BoostedOddsPromotionsHandlers.PromotionHelperHandlers(mockedMainPlayerStore, authStore);
        });

        afterEach(() => {
            jest.resetAllMocks();
        });

        describe("handle", () => {
            const mockData: Array<BaseBoostedOddsModel> = [{ gameId: 1 }];

            it("should use Instant strategy when authStore system is Instant", () => {
                // Arrange
                authStore.system = AppTypes.Instant;
                const mockResult = [{ gameId: 1 }];
                jest.spyOn(promotionHelperHandlers as any, "filterByStorageGameIds").mockReturnValue(mockResult);

                // Act
                const result = promotionHelperHandlers.handle(mockData);

                // Assert
                expect(result).toEqual(mockResult);
                expect(promotionHelperHandlers["filterByStorageGameIds"]).toHaveBeenCalledWith(
                    mockData,
                    "gameIdsSupportBoostedOddsForInstantSite"
                );
            });

            it("should use MobileDirect strategy when authStore system is MobileDirect", () => {
                // Arrange
                authStore.system = AppTypes.MobileDirect;
                const mockResult = [{ gameId: 1 }];
                jest.spyOn(promotionHelperHandlers as any, "filterByStorageGameIds").mockReturnValue(mockResult);

                // Act
                const result = promotionHelperHandlers.handle(mockData);

                // Assert
                expect(result).toEqual(mockResult);
                expect(promotionHelperHandlers["filterByStorageGameIds"]).toHaveBeenCalledWith(mockData, "supportedGamesId");
            });

            it("should use default strategy for other systems", () => {
                // Arrange
                authStore.system = AppTypes.Club;
                const mockResult = [{ gameId: 1 }];
                jest.spyOn(promotionHelperHandlers as any, "filterByOfferGames").mockReturnValue(mockResult);

                // Act
                const result = promotionHelperHandlers.handle(mockData);

                // Assert
                expect(result).toEqual(mockResult);
                expect(promotionHelperHandlers["filterByOfferGames"]).toHaveBeenCalledWith(mockData);
            });
        });

        describe("filterByOfferGames", () => {
            it("should filter promotions by matching game IDs with offer games", () => {
                // Arrange
                const mockData = [{ gameId: 1 }, { gameId: 2 }, { gameId: 3 }];
                mockedMainPlayerStore.offerGames = [{ gameId: 1 }, { gameId: 2 }];

                // Act
                const result = promotionHelperHandlers["filterByOfferGames"](mockData);

                // Assert
                expect(result).toEqual([{ gameId: 1 }, { gameId: 2 }]);
            });
        });

        describe("filterByStorageGameIds", () => {
            it("should filter promotions by matching game IDs from storage", () => {
                // Arrange
                const mockData = [{ gameId: 1 }, { gameId: 2 }, { gameId: 3 }];
                mockedMainPlayerStore.offerGames = [{ gameId: 1 }, { gameId: 2 }, { gameId: 3 }];
                StorageManager.get = jest.fn().mockReturnValue("1,2");

                // Act
                const result = promotionHelperHandlers["filterByStorageGameIds"](mockData, "testStorageKey");

                // Assert
                expect(result).toEqual([{ gameId: 1 }, { gameId: 2 }]);
            });

            it("should return empty array when storage is empty", () => {
                // Arrange
                const mockData = [{ gameId: 1 }, { gameId: 2 }];
                mockedMainPlayerStore.offerGames = [{ gameId: 1 }, { gameId: 2 }];
                StorageManager.get = jest.fn().mockReturnValue("");

                // Act
                const result = promotionHelperHandlers["filterByStorageGameIds"](mockData, "testStorageKey");

                // Assert
                expect(result).toEqual([]);
            });
        });
    });

    describe("BoostedOddsPopupHandlers", () => {
        let boostedOddsPopupHandlers: BoostedOddsPromotionsHandlers.BoostedOddsPopupHandlers;
        let mockpromotionHelperHandlers: BoostedOddsPromotionsHandlers.PromotionHelperHandlers;
        let mockedBoostedOddsStore = stub<BoostedOddsStore>();

        const mockedMainPlayerStore = stub<MainPlayerStore>();
        const mockedAppStore = stub<AppStore>();

        const authStore = stub<AuthStore>();
        const siteConfigs = stub<SiteConfigs>();

        beforeEach(() => {
            jest.clearAllMocks();
            mockpromotionHelperHandlers = new BoostedOddsPromotionsHandlers.PromotionHelperHandlers(mockedMainPlayerStore, authStore);

            boostedOddsPopupHandlers = new BoostedOddsPromotionsHandlers.BoostedOddsPopupHandlers(
                mockedBoostedOddsStore,
                mockedAppStore,
                authStore,
                siteConfigs,
                mockpromotionHelperHandlers
            );
        });

        afterEach(() => {
            jest.resetAllMocks();
        });

        test("constructor should call resetBoostedOddsData", () => {
            // Assert
            expect(mockedBoostedOddsStore.resetBoostedOddsData).toHaveBeenCalledTimes(1);
        });

        describe("handle", () => {
            beforeEach(() => {
                mockedMainPlayerStore.offerGames = [{ gameId: 2 }, { gameId: 3 }, { gameId: 1 }];
                mockedBoostedOddsStore.boostedOddses = stub<BoostedOddsModel[]>([{ gameId: 1 }]);
                boostedOddsPopupHandlers.setTimeoutShowBoostedOdds = jest.fn(() => {});
            });

            it("should handle new promotions and update store", () => {
                // Arrange
                mockedAppStore.isDirectMode = false;

                const newPromotions = stub<BoostedOddsModel[]>([{ gameId: 1 }, { gameId: 2 }]);
                mockedBoostedOddsStore.promotions = stub<PromotionModel[]>([{ gameId: 1 }]);

                mockpromotionHelperHandlers.handle = jest.fn(() => newPromotions);
                boostedOddsPopupHandlers.checkIfReceiveNewPromotions = jest.fn(() => true);

                // Act
                boostedOddsPopupHandlers.handle(newPromotions);

                // Assert
                expect(mockedBoostedOddsStore.increaseBoostedOddCounter).toHaveBeenCalled();
                expect(boostedOddsPopupHandlers.setTimeoutShowBoostedOdds).toHaveBeenCalled();
                expect(mockedBoostedOddsStore.setIsAllowShowBoostedOddIcon).toHaveBeenCalledWith(false);
                expect(mockedBoostedOddsStore.setBoostedOddsModels).toHaveBeenCalledWith(newPromotions);
            });

            it("should not allow show boosted odds icon when new promotions are empty", () => {
                // Arrange
                const newPromotions = stub<BoostedOddsModel[]>([]);
                mockpromotionHelperHandlers.handle = jest.fn(() => newPromotions);

                // Act
                boostedOddsPopupHandlers.handle(newPromotions);

                // Assert
                expect(mockedBoostedOddsStore.setIsAllowShowBoostedOddIcon).not.toHaveBeenCalled();
                expect(mockedBoostedOddsStore.increaseBoostedOddCounter).not.toHaveBeenCalled();
                expect(boostedOddsPopupHandlers.setTimeoutShowBoostedOdds).not.toHaveBeenCalled();
                expect(mockedBoostedOddsStore.setBoostedOddsModels).not.toHaveBeenCalled();
            });

            it("should not allow show boosted odds icon when there is no new promotion and isAllowShowBoostedOddIcon is false", () => {
                // Arrange
                const newPromotions = stub<BoostedOddsModel[]>([{ gameId: 1 }, { gameId: 2 }]);

                mockedAppStore.isDirectMode = false;
                mockedBoostedOddsStore.isAllowShowBoostedOddIcon = false;
                mockedBoostedOddsStore.promotions = stub<PromotionModel[]>([{ gameId: 1 }]);

                mockpromotionHelperHandlers.handle = jest.fn(() => newPromotions);
                boostedOddsPopupHandlers.checkIfReceiveNewPromotions = jest.fn(() => false);

                // Act
                boostedOddsPopupHandlers.handle(newPromotions);

                // Assert
                expect(mockedBoostedOddsStore.increaseBoostedOddCounter).not.toHaveBeenCalled();
                expect(boostedOddsPopupHandlers.setTimeoutShowBoostedOdds).not.toHaveBeenCalled();
            });

            it("should not allow show boosted odds icon when promotions models are empty", () => {
                // Arrange
                const newPromotions = stub<BoostedOddsModel[]>([{ gameId: 1 }, { gameId: 2 }]);

                mockedAppStore.isDirectMode = false;
                mockedBoostedOddsStore.isAllowShowBoostedOddIcon = true;
                mockedBoostedOddsStore.promotions = stub<PromotionModel[]>([]);

                mockpromotionHelperHandlers.handle = jest.fn(() => newPromotions);
                boostedOddsPopupHandlers.checkIfReceiveNewPromotions = jest.fn(() => true);

                // Act
                boostedOddsPopupHandlers.handle(newPromotions);

                // Assert
                expect(mockedBoostedOddsStore.increaseBoostedOddCounter).not.toHaveBeenCalled();
                expect(boostedOddsPopupHandlers.setTimeoutShowBoostedOdds).toBeCalledTimes(1);
            });

            it("should not allow show boosted odds icon when it is direct mode", () => {
                // Arrange
                mockedAppStore.isDirectMode = true;

                const newPromotions = stub<BoostedOddsModel[]>([{ gameId: 1 }, { gameId: 2 }]);
                mockedBoostedOddsStore.promotions = stub<PromotionModel[]>([{ gameId: 1 }]);

                mockpromotionHelperHandlers.handle = jest.fn(() => newPromotions);
                boostedOddsPopupHandlers.checkIfReceiveNewPromotions = jest.fn(() => true);

                // Act
                boostedOddsPopupHandlers.handle(newPromotions);

                // Assert
                expect(mockedBoostedOddsStore.increaseBoostedOddCounter).not.toHaveBeenCalled();
                expect(boostedOddsPopupHandlers.setTimeoutShowBoostedOdds).not.toHaveBeenCalled();
            });
        });

        describe("checkIfReceiveNewPromotions", () => {
            const newPromotions = stub<BoostedOddsModel[]>([{ gameId: 3 }, { gameId: 2 }]);
            it("should return true if newPromotions length is greater than boostedOddses length", () => {
                // Arrange
                const boostedOddses = stub<BoostedOddsModel[]>([{ gameId: 2 }]);

                // Act
                const result = boostedOddsPopupHandlers.checkIfReceiveNewPromotions(newPromotions, boostedOddses);

                // Assert
                expect(result).toBe(true);
            });

            it("should return true if there are new promotions not present in boostedOddses", () => {
                // Arrange
                const boostedOddses = stub<BoostedOddsModel[]>([{ gameId: 1 }]);
                boostedOddsPopupHandlers.arePromotionsEqual = jest.fn(() => false);

                // Act
                const result = boostedOddsPopupHandlers.checkIfReceiveNewPromotions(newPromotions, boostedOddses);

                // Assert
                expect(result).toBe(true);
            });

            it("should return false if newPromotions length is not greater than boostedOddses length and there are no new promotions", () => {
                // Arrange
                const boostedOddses = stub<BoostedOddsModel[]>([{ gameId: 3 }, { gameId: 2 }]);
                boostedOddsPopupHandlers.arePromotionsEqual = jest.fn(() => true);

                // Act
                const result = boostedOddsPopupHandlers.checkIfReceiveNewPromotions(newPromotions, boostedOddses);

                // Assert
                expect(result).toBe(false);
            });
        });

        describe("arePromotionsEqual", () => {
            it("should return true for equal promotions", () => {
                // Arrange
                const promotion1 = stub<BoostedOddsModel>({
                    _id: "promotionId1",
                    startDateTime: "2023-08-31T10:00:00Z",
                    endDateTime: "2023-08-31T12:00:00Z",
                });

                const promotion2 = stub<BoostedOddsModel>({
                    _id: "promotionId1",
                    startDateTime: "2023-08-31T10:00:00Z",
                    endDateTime: "2023-08-31T12:00:00Z",
                });

                // Act
                const result = boostedOddsPopupHandlers.arePromotionsEqual(promotion1, promotion2);

                // Assert
                expect(result).toBe(true);
            });

            it("should return false for promotions with different _id", () => {
                // Arrange
                const promotion1 = stub<BoostedOddsModel>({
                    _id: "promotionId1",
                    startDateTime: "2023-08-31T10:00:00Z",
                    endDateTime: "2023-08-31T12:00:00Z",
                });

                const promotion2 = stub<BoostedOddsModel>({
                    _id: "promotionId2",
                    startDateTime: "2023-08-31T10:00:00Z",
                    endDateTime: "2023-08-31T12:00:00Z",
                });

                // Act
                const result = boostedOddsPopupHandlers.arePromotionsEqual(promotion1, promotion2);

                // Assert
                expect(result).toBe(false);
            });

            it("should return false for promotions with different startDateTime", () => {
                // Arrange
                const promotion1 = stub<BoostedOddsModel>({
                    _id: "promotionId1",
                    startDateTime: "2023-08-31T10:00:00Z",
                    endDateTime: "2023-08-31T12:00:00Z",
                });

                const promotion2 = stub<BoostedOddsModel>({
                    _id: "promotionId2",
                    startDateTime: "2023-09-31T10:00:00Z",
                    endDateTime: "2023-08-31T12:00:00Z",
                });

                // Act
                const result = boostedOddsPopupHandlers.arePromotionsEqual(promotion1, promotion2);

                // Assert
                expect(result).toBe(false);
            });
        });

        jest.useFakeTimers();
        describe("setTimeoutShowBoostedOdds", () => {
            let delayMinutes = 0.2;

            beforeEach(() => {
                // Arrange
                siteConfigs.boostedOddsDelayTimeByMinutes = delayMinutes;
                boostedOddsPopupHandlers.clearTimeout = jest.fn();
            });

            afterEach(() => {
                jest.clearAllTimers();
                jest.resetAllMocks();
            });

            it("should set isAllowShowBoostedOddIcon to true after the delay", () => {
                // Act
                boostedOddsPopupHandlers.setTimeoutShowBoostedOdds();
                jest.advanceTimersByTime(delayMinutes * 60 * 1000);

                // Assert
                expect(boostedOddsPopupHandlers.clearTimeout).toHaveBeenCalled();
                expect(mockedBoostedOddsStore.setIsAllowShowBoostedOddIcon).toHaveBeenCalledWith(true);
            });

            it("should not set isAllowShowBoostedOddIcon to true before the delay", () => {
                // Act
                boostedOddsPopupHandlers.setTimeoutShowBoostedOdds();

                // Assert
                expect(boostedOddsPopupHandlers.clearTimeout).toHaveBeenCalled();
                expect(mockedBoostedOddsStore.setIsAllowShowBoostedOddIcon).not.toHaveBeenCalled();
            });
        });

        describe("getDelayTime", () => {
            const data = [
                [undefined, 900000],
                [5, 300000],
            ];
            test.each(data)(
                "should return the boostedOddsDelayTimeByMinutes multiplied by minutesToMillisecond correctly",
                (delaytimeMinutesByConfig, explectedDelayTimeByMillisecond) => {
                    // Arrange
                    siteConfigs.boostedOddsDelayTimeByMinutes = delaytimeMinutesByConfig;
                    const handler = new BoostedOddsPromotionsHandlers.BoostedOddsPopupHandlers(
                        mockedBoostedOddsStore,
                        mockedAppStore,
                        authStore,
                        siteConfigs,
                        mockpromotionHelperHandlers
                    );

                    // Act
                    const result = handler.getDelayTime();

                    // Assert
                    expect(result).toBe(explectedDelayTimeByMillisecond);
                }
            );
        });

        describe("clearTimeout", () => {
            let clearTimeoutSpy: jest.SpyInstance<void, [timeoutId: string | number | NodeJS.Timeout | undefined], any>;

            beforeEach(() => {
                clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
            });

            it("should clear the timeout if it exists", () => {
                // Arrange
                boostedOddsPopupHandlers.timeout = setTimeout(() => {}, 1000);

                // Act
                boostedOddsPopupHandlers.clearTimeout();

                // Assert
                expect(clearTimeoutSpy).toHaveBeenCalledWith(boostedOddsPopupHandlers.timeout);

                clearTimeoutSpy.mockRestore();
            });

            it("should do nothing if timeout does not exist", () => {
                // Act
                boostedOddsPopupHandlers.clearTimeout();

                // Assert
                expect(clearTimeoutSpy).not.toHaveBeenCalled();

                clearTimeoutSpy.mockRestore();
            });
        });

        describe("setIsLoadedPrefab", () => {
            const data = [true, false];
            test.each(data)("should call setIsLoadedPrefab function correctly", (inputedValue) => {
                mockedBoostedOddsStore.setIsLoadedPrefab(inputedValue);
                expect(mockedBoostedOddsStore.setIsLoadedPrefab).toHaveBeenCalledWith(inputedValue);
            });
        });
    });

    describe("PromotionHandlers", () => {
        let handlers: BoostedOddsPromotionsHandlers.PromotionHandlers;
        let mockedBoostedOddsStore: BoostedOddsStore;
        let mockedMainPlayerStore: MainPlayerStore;
        let mockpromotionHelperHandlers: BoostedOddsPromotionsHandlers.PromotionHelperHandlers;
        const authStore = stub<AuthStore>();
        const mockPromotions: PromotionModel[] = stub<PromotionModel[]>([{ gameId: 1 }]);

        beforeEach(() => {
            jest.clearAllMocks();
            mockedBoostedOddsStore = stub<BoostedOddsStore>();
            mockedMainPlayerStore = stub<MainPlayerStore>();
            mockpromotionHelperHandlers = new BoostedOddsPromotionsHandlers.PromotionHelperHandlers(mockedMainPlayerStore, authStore);
        });

        it("handle method should set promotion models", () => {
            // Arrange
            mockpromotionHelperHandlers.handle = jest.fn(() => [{ gameId: 1 }]);
            handlers = new BoostedOddsPromotionsHandlers.PromotionHandlers(mockedBoostedOddsStore, mockpromotionHelperHandlers);

            // Act
            handlers.handle(mockPromotions);

            // Assert
            expect(mockedBoostedOddsStore.setPromotionModels).toHaveBeenCalledWith([mockPromotions[0]]);
        });

        it("handle method should not set promotion models if no matching games", () => {
            // Arrange
            const newPromotions = stub<PromotionModel[]>([]);
            mockpromotionHelperHandlers.handle = jest.fn(() => newPromotions);
            handlers = new BoostedOddsPromotionsHandlers.PromotionHandlers(mockedBoostedOddsStore, mockpromotionHelperHandlers);

            // Act
            handlers.handle(mockPromotions);

            // Assert
            expect(mockedBoostedOddsStore.setPromotionModels).not.toHaveBeenCalled();
        });
    });
});
