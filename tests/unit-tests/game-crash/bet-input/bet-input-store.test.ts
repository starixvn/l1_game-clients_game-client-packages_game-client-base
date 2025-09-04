import { stub } from "jest-auto-stub";
import { BetInputStore } from "../../../../src/game-crash/bet-input/bet-input-store";
import { CrashCashOutStore } from "../../../../src/game-crash/cash-out/crash-cash-out-store";
import { IGameCrashUserSettings } from "../../../../src/game-crash/game-crash-messages";
import { GameConfigStore } from "../../../../src/game/game-configs/game-config-store";
import { RoundStore } from "../../../../src/game/rounds/round-store";
import { StorageManager } from "../../../../src/shared/utils/storage-manager";

jest.mock("../../../../src/shared/utils");

describe("BetInputStore", () => {
    let betInputStore: BetInputStore;
    let roundStore: RoundStore;
    let gameConfig: GameConfigStore;
    let cashOutStore: CrashCashOutStore;

    beforeAll(() => {
        roundStore = stub<RoundStore>();
        gameConfig = stub<GameConfigStore>();
        cashOutStore = stub<CrashCashOutStore>();
    });

    beforeEach(() => {
        betInputStore = new BetInputStore(roundStore, gameConfig, cashOutStore);
    });

    describe("setBetAmountFromOwnBets", () => {
        it("when have ownBets", () => {
            // Arrange
            const ownBets = {
                amount: 10,
                playerId: "123",
                name: "abc",
                autoCashOut: 1.5,
                rate: 1.2,
                time: "10.12.34",
            };

            // Act
            betInputStore["setBetAmountFromOwnBets"](ownBets);

            //Assert
            expect(betInputStore.betAmount).toEqual(10);
        });

        it("when ownBets have cashOut", () => {
            // Arrange
            const ownBets = {
                amount: 10,
                playerId: "123",
                name: "abc",
                autoCashOut: 1.5,
                rate: 1.2,
                time: "10.12.34",
                cashOut: {
                    amount: 10,
                    win: 20,
                    multiplier: 2,
                    reachMaxWin: false,
                    cashOutWin: 20,
                },
            };

            // Act
            betInputStore["setBetAmountFromOwnBets"](ownBets);

            //Assert
            expect(betInputStore.betAmount).toEqual(-1);
        });
    });

    describe("initBetAmount", () => {
        it("when userSetting have betAmount", () => {
            // Arrange
            const userSetting = {
                betAmount: 10,
                enableAutoCashOut: true,
                autoCashOutMultiplier: 1.5,
            };
            StorageManager.get = jest.fn(() => userSetting);

            //Act
            betInputStore.initBetAmount(userSetting);

            //Assert
            expect(betInputStore.betAmount).toBe(10);
        });

        it("when userSetting have not betAmount", () => {
            // Arrange
            const userSetting = stub<IGameCrashUserSettings>({
                betAmount: undefined
            });
            StorageManager.get = jest.fn().mockReturnValueOnce(userSetting);
            Object.defineProperty(roundStore, "minBet", { value: 5, configurable: true, writable: true });

            //Act
            betInputStore.initBetAmount(userSetting);

            //Assert
            expect(betInputStore.betAmount).toEqual(5);
        });
    });

    describe("decreaseStatus", () => {
        it("when betAmount > minBet", () => {
            // Arrange
            betInputStore.betAmount = 10;
            Object.defineProperty(roundStore, "minBet", { value: 5, configurable: true, writable: true });

            //Act

            //Assert
            expect(betInputStore.decreaseStatus).toEqual(true);
        });

        it("when betAmount <= minBet", () => {
            // Arrange
            betInputStore.betAmount = 10;
            Object.defineProperty(roundStore, "minBet", { value: 15, configurable: true, writable: true });

            //Act

            //Assert
            expect(betInputStore.decreaseStatus).toEqual(false);
        });
    });

    describe("increaseStatus", () => {
        it("when betAmount < maxBet", () => {
            // Arrange
            betInputStore.betAmount = 10;
            Object.defineProperty(roundStore, "maxBet", { value: 15, configurable: true, writable: true });

            //Act

            //Assert
            expect(betInputStore.increaseStatus).toEqual(true);
        });

        it("when betAmount >= minBet", () => {
            // Arrange
            betInputStore.betAmount = 10;
            Object.defineProperty(roundStore, "maxBet", { value: 5, configurable: true, writable: true });

            //Act

            //Assert
            expect(betInputStore.increaseStatus).toEqual(false);
        });
    });

    describe("betAmountRatio", () => {
        it("test betAmountRatio", () => {
            // Arrange
            betInputStore.betAmount = 10;
            cashOutStore.ratio = 0.5;

            //Act

            //Assert
            expect(betInputStore.betAmountRatio).toEqual(5);
        });
    });

    describe("minBet", () => {
        it("test minBet", () => {
            // Arrange
            Object.defineProperty(roundStore, "minBet", { value: 5, configurable: true, writable: true });

            //Assert
            expect(betInputStore.minBet).toEqual(5);
        });
    });

    describe("maxBet", () => {
        it("test maxBet", () => {
            // Arrange
            Object.defineProperty(roundStore, "maxBet", { value: 5, configurable: true, writable: true });

            //Assert
            expect(betInputStore.maxBet).toEqual(5);
        });
    });

    describe("isAmountGreaterMinBet", () => {
        it("when betAmount > minBet", () => {
            //Arrange
            betInputStore.betAmount = 10;
            Object.defineProperty(roundStore, "minBet", { value: 5, configurable: true, writable: true });

            //Assert
            expect(betInputStore.isAmountGreaterMinBet).toEqual(true);
        });

        it("when betAmount < minBet", () => {
            //Arrange
            betInputStore.betAmount = 10;
            Object.defineProperty(roundStore, "minBet", { value: 15, configurable: true, writable: true });

            //Assert
            expect(betInputStore.isAmountGreaterMinBet).toEqual(false);
        });
    });
});
