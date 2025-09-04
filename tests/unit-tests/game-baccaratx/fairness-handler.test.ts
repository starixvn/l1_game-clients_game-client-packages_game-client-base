import { stub } from "jest-auto-stub";
import { FairnessHandler } from "../../../src/game-baccaratx/cut-card-pf/fairness-handler";
import { FairnessStore } from "../../../src/game-baccaratx/cut-card-pf/fairness-store";
import { ShoePFHandler } from "../../../src/game-baccaratx/shoe-pf/shoe-pf-handler";
import { ShoeStore } from "../../../src/game-baccaratx/shoes/shoe-store";
import { ConnectionStore } from "../../../src/game/connection/connection-store";
import { GameUserSettingHandler } from "../../../src/game/game-user-settings/game-user-setting-handler";
import { GameUserSettingStore } from "../../../src/game/game-user-settings/game-user-setting-store";
import { MainPlayerStore } from "../../../src/players/main-player-store";
import { GameClientEmitMessage } from "../../../src/shared/models/game-messages";
import { StorageManager } from "../../../src/shared/utils";

jest.mock("../../../src/shared/utils", () => ({
    StorageManager: {
        set: jest.fn(),
        get: jest.fn(),
    },
    localStorageKeys: {
        permanentGameUserSetting: "permanentGameUserSetting",
    },
}));

describe("FairnessHandler", () => {
    let fairnessHandler: FairnessHandler;
    let fairnessStore: FairnessStore;
    let connectionStore: ConnectionStore;
    let gameUserSettingStore: GameUserSettingStore;
    let gameUserSettingHandler: GameUserSettingHandler;
    let shoePFHandler: ShoePFHandler;
    let shoeStore: ShoeStore;
    let mainPlayerStore: MainPlayerStore;

    beforeEach(() => {
        fairnessStore = stub<FairnessStore>({
            clientSeed: "",
            dontShowAgain: false,
            minClientSeed: 1,
            maxClientSeed: 100,
            isShowFairnessSettingsPopup: false,
            showWaitingScreen: false,
            openVerification: { isOpen: false },
            openCutCardIndex: { isOpen: false },
            cutCardInfo: undefined,
        });
        connectionStore = stub<ConnectionStore>({
            send: jest.fn(),
        });
        gameUserSettingStore = stub<GameUserSettingStore>();
        gameUserSettingHandler = stub<GameUserSettingHandler>({
            savePermanentStorage: jest.fn(),
        });
        shoePFHandler = stub<ShoePFHandler>({
            requestRoundPF: jest.fn(),
        });
        shoeStore = stub<ShoeStore>({
            shoeInfo: {
                cutCardIndex: undefined,
                roundTime: 0,
                burnedCards: 0,
                firstCard: { rank: 1, suit: 1 },
                currentIndex: 0,
            },
        });
        mainPlayerStore = stub<MainPlayerStore>({
            UID: 12345,
            currencyGroup: "USD",
            readyUserInfo: true,
        });

        fairnessHandler = new FairnessHandler(
            fairnessStore,
            connectionStore,
            gameUserSettingStore,
            gameUserSettingHandler,
            shoePFHandler,
            shoeStore,
            mainPlayerStore,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("Storage Key", () => {
        it("should generate correct permanentStorageKey", () => {
            // Act
            const key = fairnessHandler.permanentStorageKey;

            // Assert
            expect(key).toBe("permanentGameUserSetting-12345-USD");
        });
    });

    describe("loadClientSettingFromStorage", () => {
        it("should load existing client settings from storage", () => {
            // Arrange
            const mockSettings = {
                clientSeed: "123",
                dontShowAgain: true,
            };
            (StorageManager.get as jest.Mock).mockReturnValue(mockSettings);

            // Act
            fairnessHandler.loadClientSettingFromStorage();

            // Assert
            expect(fairnessStore.clientSeed).toBe("123");
            expect(fairnessStore.dontShowAgain).toBe(true);
        });

        it("should generate new client seed if no existing settings", () => {
            // Arrange
            (StorageManager.get as jest.Mock).mockReturnValue(null);
            const generateSpy = jest.spyOn(fairnessHandler as any, "randomClientSeedValue");
            generateSpy.mockReturnValue("50");

            // Act
            fairnessHandler.loadClientSettingFromStorage();

            // Assert
            expect(generateSpy).toHaveBeenCalled();
            expect(fairnessStore.clientSeed).toBe("50");
            expect(fairnessStore.dontShowAgain).toBe(false);
        });
    });

    describe("saveClientSeed", () => {
        it("should save client seed and trigger storage save", () => {
            // Arrange
            const clientSeed = "123";

            // Act
            fairnessHandler.saveClientSeed(clientSeed);

            // Assert
            expect(fairnessStore.clientSeed).toBe(clientSeed);
            expect(gameUserSettingHandler.savePermanentStorage).toHaveBeenCalled();
        });
    });

    describe("Client Seed Range", () => {
        it("should set min client seed", () => {
            // Act
            fairnessHandler.setMinClientSeed(10);

            // Assert
            expect(fairnessStore.minClientSeed).toBe(10);
        });

        it("should set max client seed", () => {
            // Act
            fairnessHandler.setMaxClientSeed(1000);

            // Assert
            expect(fairnessStore.maxClientSeed).toBe(1000);
        });

        it("should not generate client seed if min or max is 0", () => {
            // Arrange
            fairnessStore.clientSeed = "";
            fairnessStore.minClientSeed = 0;
            fairnessStore.maxClientSeed = 100;

            // Act
            fairnessHandler.generateClientSeed();

            // Assert
            expect(fairnessStore.clientSeed).toBe("");
        });

        it("should generate client seed within range", () => {
            // Arrange
            fairnessStore.clientSeed = "";
            fairnessStore.minClientSeed = 1;
            fairnessStore.maxClientSeed = 10;
            const randomSeed = "5";
            const randomSpy = jest.spyOn(fairnessHandler as any, "randomClientSeedValue");
            randomSpy.mockReturnValue(randomSeed);

            // Act
            fairnessHandler.generateClientSeed();

            // Assert
            expect(fairnessStore.clientSeed).toBe(randomSeed);
        });
    });

    describe("Fairness Settings Popup", () => {
        it("should show fairness settings popup only in cut card phase", () => {
            // Arrange
            shoeStore.shoeInfo = {
                cutCardIndex: undefined,
                roundTime: 0,
                burnedCards: 0,
                firstCard: { rank: 1, suit: 1 },
                currentIndex: 0,
            };

            // Act
            fairnessHandler.handleShowFairnessSettingsPopup(true);

            // Assert
            expect(fairnessStore.isShowFairnessSettingsPopup).toBe(true);
        });

        it("should not show fairness settings popup outside cut card phase", () => {
            // Arrange
            shoeStore.shoeInfo = {
                cutCardIndex: 10,
                roundTime: 0,
                burnedCards: 0,
                firstCard: { rank: 1, suit: 1 },
                currentIndex: 0,
            };

            // Act
            fairnessHandler.handleShowFairnessSettingsPopup(true);

            // Assert
            expect(fairnessStore.isShowFairnessSettingsPopup).toBe(false);
        });

        it("should update waiting screen when hiding popup", () => {
            // Arrange
            shoeStore.shoeInfo = {
                cutCardIndex: undefined,
                roundTime: 0,
                burnedCards: 0,
                firstCard: { rank: 1, suit: 1 },
                currentIndex: 0,
            };

            // Act
            fairnessHandler.handleShowFairnessSettingsPopup(false);

            // Assert
            expect(fairnessStore.showWaitingScreen).toBe(true);
        });
    });

    describe("Verification Handling", () => {
        it("should open verification with round ID", () => {
            // Arrange
            const roundId = 123;

            // Act
            fairnessHandler.openVerificationHistory(roundId);

            // Assert
            expect(shoePFHandler.requestRoundPF).toHaveBeenCalledWith(roundId);
            expect(fairnessStore.openVerification).toEqual({ isOpen: true, roundId });
        });

        it("should close verification", () => {
            // Act
            fairnessHandler.closeVerification();

            // Assert
            expect(fairnessStore.openVerification).toEqual({ isOpen: false });
        });
    });

    describe("Cut Card Index Handling", () => {
        it("should open cut card index with round ID", () => {
            // Arrange
            const roundId = 123;

            // Act
            fairnessHandler.openCutCardIndex(roundId);

            // Assert
            expect(fairnessStore.openCutCardIndex).toEqual({ isOpen: true, roundId });
        });

        it("should close cut card index", () => {
            // Act
            fairnessHandler.closeCutCardIndex();

            // Assert
            expect(fairnessStore.openCutCardIndex).toEqual({ isOpen: false });
        });
    });

    describe("Client Seed Operations", () => {
        it("should send client seed to server", () => {
            // Arrange
            const clientSeed = "123";

            // Act
            fairnessHandler.sendClientSeed(clientSeed);

            // Assert
            expect(fairnessStore.clientSeed).toBe(clientSeed);
            expect(connectionStore.send).toHaveBeenCalledWith(
                GameClientEmitMessage.CutCard.eventName,
                { cutCardIndex: clientSeed }
            );
        });

        it("should update dont show again setting", () => {
            // Act
            fairnessHandler.updateDontShowAgain(true);

            // Assert
            expect(fairnessStore.dontShowAgain).toBe(true);
            expect(gameUserSettingHandler.savePermanentStorage).toHaveBeenCalled();
        });

        it("should reset cut card info", () => {
            // Act
            fairnessHandler.resetCutCardInfo();

            // Assert
            expect(fairnessStore.cutCardInfo).toBeNull();
        });
    });

    describe("Storage Actions", () => {
        it("should save settings to storage", () => {
            // Arrange
            fairnessStore.clientSeed = "123";
            fairnessStore.dontShowAgain = true;
            const existingSettings = { someOtherSetting: true };
            (StorageManager.get as jest.Mock).mockReturnValue(existingSettings);

            // Act
            fairnessHandler["onSaveStorage"]();

            // Assert
            expect(StorageManager.set).toHaveBeenCalledWith(
                fairnessHandler.permanentStorageKey,
                {
                    ...existingSettings,
                    clientSeed: "123",
                    dontShowAgain: true,
                }
            );
        });

        it("should handle empty existing settings", () => {
            // Arrange
            fairnessStore.clientSeed = "123";
            fairnessStore.dontShowAgain = true;
            (StorageManager.get as jest.Mock).mockReturnValue(null);

            // Act
            fairnessHandler["onSaveStorage"]();

            // Assert
            expect(StorageManager.set).toHaveBeenCalledWith(
                fairnessHandler.permanentStorageKey,
                {
                    clientSeed: "123",
                    dontShowAgain: true,
                }
            );
        });
    });
});
