import { stub } from "jest-auto-stub";
import { VerificationMode } from "../../../../../src/features/provably-fair/round-base/definitions";
import { ProvablyFairHandler } from "../../../../../src/features/provably-fair/round-base/provably-fair-handler";
import { ProvablyFairStore } from "../../../../../src/features/provably-fair/round-base/provably-fair-store";
import { BetStore } from "../../../../../src/game/bets";
import { GameUserSettingHandler } from "../../../../../src/game/game-user-settings/game-user-setting-handler";
import { GameUserSettingStore } from "../../../../../src/game/game-user-settings/game-user-setting-store";
import { RoundPFHandler } from "../../../../../src/game/round-pf";
import { RoundTimeStore } from "../../../../../src/game/rounds/round-time-store";
import { MainPlayerStore } from "../../../../../src/players/main-player-store";
import { GameServiceMessage } from "../../../../../src/shared";
import { StorageManager } from "../../../../../src/shared/utils";

jest.mock("../../../../../src/shared/utils", () => ({
    StorageManager: {
        set: jest.fn(),
        get: jest.fn(),
    },
    localStorageKeys: {
        permanentGameUserSetting: "permanentGameUserSetting",
    },
}));

describe("ProvablyFairHandler", () => {
    let provablyFairHandler: ProvablyFairHandler;
    let provablyFairStore: ProvablyFairStore;
    let roundTimeStore: RoundTimeStore;
    let gameUserSettingStore: GameUserSettingStore;
    let gameUserSettingHandler: GameUserSettingHandler;
    let roundPFHandler: RoundPFHandler;
    let betStore: BetStore;
    let mainPlayerStore: MainPlayerStore;

    beforeEach(() => {
        provablyFairStore = stub<ProvablyFairStore>({
            clientSeed: "test-seed",
            randomClientSeed: "random-seed",
            manualClientSeed: "manual-seed",
            randomClientSeedEnabled: true,
            lastBetClientSeed: undefined,
            pf: undefined,
            openClientSeedPopup: undefined,
            openVerification: undefined,
            generateRandomClientSeed: jest.fn(),
            resetClientSetting: jest.fn(),
        });
        roundTimeStore = stub<RoundTimeStore>({
            isStartRound: false,
        });
        gameUserSettingStore = stub<GameUserSettingStore>();
        gameUserSettingHandler = stub<GameUserSettingHandler>({
            savePermanentStorage: jest.fn(),
        });
        roundPFHandler = stub<RoundPFHandler>({
            requestRoundPF: jest.fn(),
        });
        betStore = stub<BetStore>({
            lastReceivedBet: undefined,
        });
        mainPlayerStore = stub<MainPlayerStore>({
            UID: 12345,
            currencyGroup: "USD",
            readyUserInfo: true,
        });

        provablyFairHandler = new ProvablyFairHandler(
            provablyFairStore,
            roundTimeStore,
            gameUserSettingStore,
            gameUserSettingHandler,
            roundPFHandler,
            betStore,
            mainPlayerStore,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("Storage Key", () => {
        it("should generate correct permanentStorageKey", () => {
            // Act
            const key = provablyFairHandler.permanentStorageKey;

            // Assert
            expect(key).toBe("permanentGameUserSetting-12345-USD");
        });
    });

    describe("Client Seed Management", () => {
        it("should assign last bet client seed when not set", () => {
            // Arrange
            Object.defineProperty(provablyFairStore, 'lastBetClientSeed', { value: "" });
            Object.defineProperty(provablyFairStore, 'clientSeed', { value: "current-seed" });

            // Act
            provablyFairHandler["assignLastBetClientSeed"]();

            // Assert
            expect(provablyFairStore.lastBetClientSeed).toBe("current-seed");
        });

        it("should not assign last bet client seed when already set", () => {
            // Arrange
            Object.defineProperty(provablyFairStore, 'lastBetClientSeed', { value: "existing-seed" });
            Object.defineProperty(provablyFairStore, 'clientSeed', { value: "current-seed" });

            // Act
            provablyFairHandler["assignLastBetClientSeed"]();

            // Assert
            expect(provablyFairStore.lastBetClientSeed).toBe("existing-seed");
        });

        it("should clear last bet client seed", () => {
            // Arrange
            provablyFairStore.lastBetClientSeed = "test-seed";

            // Act
            provablyFairHandler.clearLastBetClientSeed();

            // Assert
            expect(provablyFairStore.lastBetClientSeed).toBeNull();
        });

        it("should handle receiving last client seed with random mode enabled", () => {
            // Arrange
            const clientSeed = "new-seed";
            provablyFairStore.randomClientSeedEnabled = true;

            // Act
            provablyFairHandler.handleReceiveLastClientSeed(clientSeed);

            // Assert
            expect(provablyFairStore.lastBetClientSeed).toBe(clientSeed);
            expect(provablyFairStore.randomClientSeed).toBe(clientSeed);
        });

        it("should handle receiving last client seed with manual mode enabled", () => {
            // Arrange
            const clientSeed = "new-seed";
            provablyFairStore.randomClientSeedEnabled = false;

            // Act
            provablyFairHandler.handleReceiveLastClientSeed(clientSeed);

            // Assert
            expect(provablyFairStore.lastBetClientSeed).toBe(clientSeed);
            expect(provablyFairStore.manualClientSeed).toBe(clientSeed);
        });

        it("should not handle undefined client seed", () => {
            // Arrange
            provablyFairStore.lastBetClientSeed = "old-seed";

            // Act
            provablyFairHandler.handleReceiveLastClientSeed(undefined as any);

            // Assert
            expect(provablyFairStore.lastBetClientSeed).toBe("old-seed");
        });
    });

    describe("Storage Operations", () => {
        it("should load existing client settings from storage", () => {
            // Arrange
            const mockSettings = {
                pf: {
                    manualClientSeed: "manual-test",
                    randomClientSeed: "random-test",
                    randomClientSeedEnabled: true,
                },
            };
            (StorageManager.get as jest.Mock).mockReturnValue(mockSettings);

            // Act
            provablyFairHandler.loadClientSettingFromStorage();

            // Assert
            expect(provablyFairStore.manualClientSeed).toBe("manual-test");
            expect(provablyFairStore.randomClientSeed).toBe("random-test");
            expect(provablyFairStore.randomClientSeedEnabled).toBe(true);
        });

        it("should reset client settings when no storage data", () => {
            // Arrange
            (StorageManager.get as jest.Mock).mockReturnValue(null);

            // Act
            provablyFairHandler.loadClientSettingFromStorage();

            // Assert
            expect(provablyFairStore.resetClientSetting).toHaveBeenCalled();
        });

        it("should save settings to storage", () => {
            // Arrange
            provablyFairStore.randomClientSeedEnabled = true;
            provablyFairStore.randomClientSeed = "random-test";
            provablyFairStore.manualClientSeed = "manual-test";
            const existingSettings = { someOtherSetting: true };
            (StorageManager.get as jest.Mock).mockReturnValue(existingSettings);

            // Act
            provablyFairHandler["onSaveStorage"]();

            // Assert
            expect(StorageManager.set).toHaveBeenCalledWith(
                provablyFairHandler.permanentStorageKey,
                {
                    ...existingSettings,
                    pf: {
                        randomClientSeedEnabled: true,
                        randomClientSeed: "random-test",
                        manualClientSeed: "manual-test",
                    },
                }
            );
        });
    });

    describe("Client Seed Popup", () => {
        it("should open client seed popup", () => {
            // Act
            provablyFairHandler.handleClientSeedPopup(true);

            // Assert
            expect(provablyFairStore.openClientSeedPopup).toEqual({});
        });

        it("should close client seed popup", () => {
            // Act
            provablyFairHandler.handleClientSeedPopup(false);

            // Assert
            expect(provablyFairStore.openClientSeedPopup).toBeNull();
        });
    });

    describe("Client Seed Generation Mode", () => {
        it("should update client seed generation mode and save", () => {
            // Act
            provablyFairHandler.clientSeedGenerationMode(true);

            // Assert
            expect(provablyFairStore.randomClientSeedEnabled).toBe(true);
            expect(gameUserSettingHandler.savePermanentStorage).toHaveBeenCalled();
        });

        it("should save manual client seed", () => {
            // Arrange
            const manualSeed = "test-manual-seed";

            // Act
            provablyFairHandler.saveManualClientSeed(manualSeed);

            // Assert
            expect(provablyFairStore.manualClientSeed).toBe(manualSeed);
            expect(gameUserSettingHandler.savePermanentStorage).toHaveBeenCalled();
        });
    });

    describe("Verification Handling", () => {
        it("should open verification for latest round", () => {
            // Arrange
            const roundId = 123;

            // Act
            provablyFairHandler.openVerificationLatestRound(roundId);

            // Assert
            expect(roundPFHandler.requestRoundPF).toHaveBeenCalledWith(roundId);
            expect(provablyFairStore.openVerification).toEqual({
                mode: VerificationMode.LatestRounds,
                roundId,
            });
        });

        it("should open verification for history", () => {
            // Arrange
            const roundId = 123;

            // Act
            provablyFairHandler.openVerificationHistory(roundId);

            // Assert
            expect(roundPFHandler.requestRoundPF).toHaveBeenCalledWith(roundId);
            expect(provablyFairStore.openVerification).toEqual({
                mode: VerificationMode.History,
                roundId,
            });
        });

        it("should close verification", () => {
            // Act
            provablyFairHandler.closeVerification();

            // Assert
            expect(provablyFairStore.openVerification).toBeNull();
        });
    });

    describe("Event Handling", () => {
        it("should handle PF event", () => {
            // Arrange
            const pfData = { roundId: 123, serverSeedHash: "test-hash" } as GameServiceMessage.ProvablyFair;

            // Act
            provablyFairHandler.handle(pfData);

            // Assert
            expect(provablyFairStore.pf).toBe(pfData);
        });

        it("should have correct event handlers registered", () => {
            // Assert
            expect(provablyFairHandler.eventHandleList).toEqual([
                {
                    name: GameServiceMessage.ProvablyFair.eventName,
                    handle: provablyFairHandler.handle,
                },
                {
                    name: "clientSeed",
                    handle: provablyFairHandler.handleReceiveLastClientSeed,
                },
            ]);
        });
    });

    describe("Reactions", () => {
        it("should handle round start", () => {
            // Arrange
            Object.defineProperty(roundTimeStore, 'isStartRound', { value: true });

            // Act
            provablyFairHandler["saveStorage"]();

            // Assert
            expect(gameUserSettingHandler.savePermanentStorage).toHaveBeenCalled();
        });

        it("should handle new bet received", () => {
            // Arrange
            betStore.lastReceivedBet = { value: 100, isAnimated: false };
            Object.defineProperty(provablyFairStore, 'lastBetClientSeed', { value: "" });
            Object.defineProperty(provablyFairStore, 'clientSeed', { value: "current-seed" });

            // Act
            provablyFairHandler["assignLastBetClientSeed"]();

            // Assert
            expect(provablyFairStore.lastBetClientSeed).toBe("current-seed");
        });
    });
});
