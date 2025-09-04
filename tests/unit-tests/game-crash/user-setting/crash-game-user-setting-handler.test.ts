import { stub } from "jest-auto-stub";
import { AutoCashOutStore } from "../../../../src/game-crash/auto-cash-out/auto-cash-out-store";
import { BetInputStore } from "../../../../src/game-crash/bet-input/bet-input-store";
import { GameCrashUserSettingHandler } from "../../../../src/game-crash/game-user-setting/crash-game-user-setting-handler";
import { ProvablyFairHandler } from "../../../../src/game-crash/provably-fair/provably-fair-handler";
import { ProvablyFairStore } from "../../../../src/game-crash/provably-fair/provably-fair-store";
import { ConnectionStore } from "../../../../src/game/connection/connection-store";
import { GameConfigStore } from "../../../../src/game/game-configs/game-config-store";
import { GameUserSettingStore } from "../../../../src/game/game-user-settings/game-user-setting-store";
import { RoundRunningHandlers } from "../../../../src/game/rounds/round-running-handlers";
import { MainPlayerStore } from "../../../../src/players/main-player-store";
import { StorageManager } from "../../../../src/shared/utils";

jest.mock("../../../../src/shared/utils", () => ({
    StorageManager: {
        set: jest.fn(),
        get: jest.fn(),
        remove: jest.fn(),
    },
    localStorageKeys: {
        gameUserSetting: "gameUserSetting",
        permanentGameUserSetting: "permanentGameUserSetting",
    },
}));

describe("GameCrashUserSettingHandler", () => {
    let gameCrashUserSettingHandler: GameCrashUserSettingHandler;
    let roundRunning: RoundRunningHandlers;
    let connectStore: ConnectionStore;
    let betInputStore: BetInputStore;
    let autoCashOutStore: AutoCashOutStore;
    let provablyFairStore: ProvablyFairStore;
    let provablyFairHandler: ProvablyFairHandler;
    let gameUserSettingStore: GameUserSettingStore;
    let mainPlayerStore: MainPlayerStore;
    let gameConfigStore: GameConfigStore;

    beforeEach(() => {
        roundRunning = stub<RoundRunningHandlers>();
        connectStore = stub<ConnectionStore>();
        betInputStore = stub<BetInputStore>({
            initBetAmount: jest.fn(),
            betAmount: 100,
        });
        autoCashOutStore = stub<AutoCashOutStore>({
            loadMultiplierFromStorage: jest.fn(),
            enable: true,
            multiplier: 2,
        });
        provablyFairStore = stub<ProvablyFairStore>({
            randomClientSeedEnabled: true,
            randomClientSeed: "random-seed",
            manualClientSeed: "manual-seed",
        });
        provablyFairHandler = stub<ProvablyFairHandler>({
            loadClientSettingFromStorage: jest.fn(),
        });
        gameUserSettingStore = stub<GameUserSettingStore>();
        mainPlayerStore = stub<MainPlayerStore>({
            UID: 12345,
            currencyGroup: "USD",
            readyUserInfo: true,
        });
        gameConfigStore = stub<GameConfigStore>({
            minBet: 1,
        });

        gameCrashUserSettingHandler = new GameCrashUserSettingHandler(
            roundRunning,
            connectStore,
            betInputStore,
            autoCashOutStore,
            provablyFairStore,
            provablyFairHandler,
            gameUserSettingStore,
            mainPlayerStore,
            gameConfigStore,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("Storage Keys", () => {
        it("should generate correct tempStorageKey", () => {
            // Act
            const key = gameCrashUserSettingHandler.tempStorageKey;

            // Assert
            expect(key).toBe("gameUserSetting-12345-USD");
        });

        it("should generate correct permanentStorageKey", () => {
            // Act
            const key = gameCrashUserSettingHandler.permanentStorageKey;

            // Assert
            expect(key).toBe("permanentGameUserSetting-12345-USD");
        });
    });

    describe("saveTempStorage", () => {
        it("should save current settings to storage", () => {
            // Act
            gameCrashUserSettingHandler.saveTempStorage();

            // Assert
            expect(StorageManager.set).toHaveBeenCalledWith(
                gameCrashUserSettingHandler.tempStorageKey,
                {
                    enableAutoCashOut: true,
                    autoCashOutMultiplier: 2,
                    betAmount: 100,
                }
            );
        });

        it("should not include betAmount when it is 0", () => {
            // Arrange
            betInputStore.betAmount = 0;

            // Act
            gameCrashUserSettingHandler.saveTempStorage();

            // Assert
            expect(StorageManager.set).toHaveBeenCalledWith(
                gameCrashUserSettingHandler.tempStorageKey,
                {
                    enableAutoCashOut: true,
                    autoCashOutMultiplier: 2,
                }
            );
        });
    });

    describe("savePermanentStorage", () => {
        it("should save permanent settings to storage", () => {
            // Act
            gameCrashUserSettingHandler.savePermanentStorage();

            // Assert
            expect(StorageManager.set).toHaveBeenCalledWith(
                gameCrashUserSettingHandler.permanentStorageKey,
                {
                    pf: {
                        randomClientSeedEnabled: true,
                        randomClientSeed: "random-seed",
                        manualClientSeed: "manual-seed",
                    },
                }
            );
        });
    });

    describe("getGameUserSetting", () => {
        it("should get settings from storage", () => {
            // Arrange
            const mockSettings = { betAmount: 100 };
            (StorageManager.get as jest.Mock).mockReturnValue(mockSettings);

            // Act
            const result = gameCrashUserSettingHandler.getGameUserSetting();

            // Assert
            expect(StorageManager.get).toHaveBeenCalledWith(gameCrashUserSettingHandler.tempStorageKey);
            expect(result).toBe(mockSettings);
        });
    });

    describe("getPermanentSetting", () => {
        it("should get permanent settings from storage", () => {
            // Arrange
            const mockSettings = { pf: { randomClientSeed: "test" } };
            (StorageManager.get as jest.Mock).mockReturnValue(mockSettings);

            // Act
            const result = gameCrashUserSettingHandler.getPermanentSetting();

            // Assert
            expect(StorageManager.get).toHaveBeenCalledWith(gameCrashUserSettingHandler.permanentStorageKey);
            expect(result).toBe(mockSettings);
        });
    });

    describe("clearTempStorage", () => {
        it("should remove temp storage and reload stores", () => {
            // Arrange
            const reloadSpy = jest.spyOn(gameCrashUserSettingHandler, "reloadOtherStores");

            // Act
            gameCrashUserSettingHandler.clearTempStorage();

            // Assert
            expect(StorageManager.remove).toHaveBeenCalledWith(gameCrashUserSettingHandler.tempStorageKey);
            expect(reloadSpy).toHaveBeenCalled();
        });
    });

    describe("reloadOtherStores", () => {
        it("should reload all related stores with settings", () => {
            // Arrange
            const tempSettings = { betAmount: 100 };
            const permanentSettings = { pf: { randomClientSeed: "test" } };
            (StorageManager.get as jest.Mock)
                .mockReturnValueOnce(tempSettings)
                .mockReturnValueOnce(permanentSettings);

            // Act
            gameCrashUserSettingHandler.reloadOtherStores();

            // Assert
            expect(betInputStore.initBetAmount).toHaveBeenCalledWith(tempSettings);
            expect(autoCashOutStore.loadMultiplierFromStorage).toHaveBeenCalledWith(tempSettings);
            expect(provablyFairHandler.loadClientSettingFromStorage).toHaveBeenCalledWith(permanentSettings);
        });
    });

    describe("Storage Actions", () => {
        it("should save temp storage correctly", () => {
            // Act
            gameCrashUserSettingHandler.saveTempStorage();

            // Assert
            expect(StorageManager.set).toHaveBeenCalledWith(
                gameCrashUserSettingHandler.tempStorageKey,
                {
                    enableAutoCashOut: true,
                    autoCashOutMultiplier: 2,
                    betAmount: 100,
                }
            );
        });

        it("should save permanent storage correctly", () => {
            // Act
            gameCrashUserSettingHandler.savePermanentStorage();

            // Assert
            expect(StorageManager.set).toHaveBeenCalledWith(
                gameCrashUserSettingHandler.permanentStorageKey,
                {
                    pf: {
                        randomClientSeedEnabled: true,
                        randomClientSeed: "random-seed",
                        manualClientSeed: "manual-seed",
                    },
                }
            );
        });

        it("should clear temp storage and reload stores", () => {
            // Arrange
            const reloadSpy = jest.spyOn(gameCrashUserSettingHandler, "reloadOtherStores");

            // Act
            gameCrashUserSettingHandler.clearTempStorage();

            // Assert
            expect(StorageManager.remove).toHaveBeenCalledWith(gameCrashUserSettingHandler.tempStorageKey);
            expect(reloadSpy).toHaveBeenCalled();
        });

        it("should reload other stores with correct settings", () => {
            // Arrange
            const tempSettings = { betAmount: 100 };
            const permanentSettings = { pf: { randomClientSeed: "test" } };
            (StorageManager.get as jest.Mock)
                .mockReturnValueOnce(tempSettings)
                .mockReturnValueOnce(permanentSettings);

            // Act
            gameCrashUserSettingHandler.reloadOtherStores();

            // Assert
            expect(betInputStore.initBetAmount).toHaveBeenCalledWith(tempSettings);
            expect(autoCashOutStore.loadMultiplierFromStorage).toHaveBeenCalledWith(tempSettings);
            expect(provablyFairHandler.loadClientSettingFromStorage).toHaveBeenCalledWith(permanentSettings);
        });
    });
});
