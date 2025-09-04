import { stub } from "jest-auto-stub";

import { AutoCashOutHandler } from "../../../../src/game-crash/auto-cash-out/auto-cash-out-handler";
import { AutoCashOutStore } from "../../../../src/game-crash/auto-cash-out/auto-cash-out-store";
import { CrashGameConfigStore } from "../../../../src/game-crash/game-configs/crash-game-config-store";
import { RoundStore } from "../../../../src/game/rounds/round-store";
import { MainPlayerStore } from "../../../../src/players/main-player-store";

describe("AutoCashOutHandler", () => {
    let autoCashOutHandler: AutoCashOutHandler;
    let autoCashOutStore: AutoCashOutStore;
    let roundStore: RoundStore;
    let gameConfigStore: CrashGameConfigStore;
    let mainPlayerStore: MainPlayerStore

    beforeEach(() => {
        roundStore = stub<RoundStore>();
        gameConfigStore = stub<CrashGameConfigStore>();
        mainPlayerStore = stub<MainPlayerStore>()
        autoCashOutStore = new AutoCashOutStore(gameConfigStore, roundStore, mainPlayerStore);
        autoCashOutHandler = new AutoCashOutHandler(autoCashOutStore);
    });

    describe("handleEnable", () => {
        it("should update enable of autoCashOutStore", async () => {
            // Arrange

            // Act
            autoCashOutHandler.handleEnable(true);

            // Assert
            expect(autoCashOutStore.enable).toEqual(true);
        });
    });

    describe("handleMultiplier", () => {
        it("should update multiplier", async () => {
            // Arrange
            const multiplier = 2;

            // Act
            autoCashOutHandler.handleMultiplier(multiplier);

            // Assert
            expect(autoCashOutStore.multiplier).toEqual(multiplier);
        });
    });

    describe("adjustMultiplier", () => {
        it("should update multiplier", async () => {
            // Arrange
            const adjustValue = 1;
            autoCashOutStore.multiplier = 1;

            // Act
            autoCashOutHandler.adjustMultiplier(adjustValue);

            // Assert
            expect(autoCashOutStore.multiplier).toEqual(2);
        });
    });
});
