import { stub } from "jest-auto-stub";
import { ConnectionHandlers } from "./../../../../src/game/connection/connection-handlers";

import { RoundHistory } from "./../../../../src/game/round-histories/round-history-store";

import { AutoPlayHandler } from "../../../../src/game-crash/auto-play/auto-play-handler";
import { BetInputStore } from "../../../../src/game-crash/bet-input/bet-input-store";
import { CrashCashOutHandlers } from "../../../../src/game-crash/cash-out/crash-cash-out-handlers";
import { CrashCashOutStore } from "../../../../src/game-crash/cash-out/crash-cash-out-store";
import { ButtonState } from "../../../../src/game-crash/game-crash-messages";
import { MultiplierStore } from "../../../../src/game-crash/multiplier/multiplier-store";
import { PlayerActionHandlers } from "../../../../src/game-crash/player-actions/player-action-handlers";
import { PlayerActionStore } from "../../../../src/game-crash/player-actions/player-action-store";
import { BetStore } from "../../../../src/game/bets/bet-store";
import { GameConfigStore } from "../../../../src/game/game-configs";
import { RoundHistoryStore } from "../../../../src/game/round-histories/round-history-store";
import { RoundTimeStore } from "../../../../src/game/rounds/round-time-store";

describe("CrashCashOutHandlers", () => {
    let cashOutHandlers: CrashCashOutHandlers;
    let cashOutStore: CrashCashOutStore;
    let roundHistoryStore: RoundHistoryStore;
    let roundTimeStore: RoundTimeStore;
    let betStore: BetStore;
    let multiplierStore: MultiplierStore;
    let playerActionStore: PlayerActionStore;
    let playerActionHandlers: PlayerActionHandlers;
    let autoPlayHandler: AutoPlayHandler;
    let gameConfigStore: GameConfigStore;
    let betInputStore: BetInputStore;
    let retryGameHandler: ConnectionHandlers.RetryGameHandler;
    const halfCashOut = {
        amount: 25,
        win: 26.25,
        cashOutWin: 26.25,
        multiplier: 1.05,
        reachMaxWin: false,
    };
    const cashOut = {
        amount: 50,
        win: 54.5,
        cashOutWin: 54.5,
        multiplier: 1.09,
        reachMaxWin: false,
    };

    beforeAll(() => {
        cashOutStore = stub<CrashCashOutStore>({ setCashOutNotice: jest.fn() });
        roundHistoryStore = stub<RoundHistoryStore>();
        roundTimeStore = stub<RoundTimeStore>();
        betStore = stub<BetStore>();
        multiplierStore = stub<MultiplierStore>();
        playerActionStore = stub<PlayerActionStore>();
        playerActionHandlers = stub<PlayerActionHandlers>({ changeButtonBetNextRound: jest.fn() });
        autoPlayHandler = stub<AutoPlayHandler>({ autoEnableEarlyBet: jest.fn() });
        gameConfigStore = stub<GameConfigStore>();
        betInputStore = stub<BetInputStore>();
        retryGameHandler = stub<ConnectionHandlers.RetryGameHandler>();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        cashOutHandlers = new CrashCashOutHandlers(
            cashOutStore,
            roundHistoryStore,
            roundTimeStore,
            betStore,
            multiplierStore,
            playerActionStore,
            playerActionHandlers,
            gameConfigStore,
            betInputStore,
            retryGameHandler
        );
    });

    describe("handleCashOutHalf", () => {
        beforeEach(() => {
            // Arrange
            cashOutHandlers["handleHalfCashOutMessage"] = jest.fn();

            // Act
            cashOutHandlers["handleCashOutHalf"](halfCashOut);
        });

        it("should call handleHalfCashOutMessage()", () => {
            // Assert
            expect(cashOutHandlers["handleHalfCashOutMessage"]).toBeCalled();
        });

        it("should call setCashOutNotice() of CrashCashOutStore", () => {
            // Assert
            expect(cashOutStore.setCashOutNotice).toBeCalled();
        });
    });

    describe("handleHalfCashOutMessage", () => {
        beforeEach(() => {
            // Arrange
            cashOutHandlers["setHalfCashedOutValue"] = jest.fn();

            // Act
            cashOutHandlers["handleHalfCashOutMessage"](halfCashOut);
        });

        it("should update halfCashOut of CrashCashOutStore", () => {
            // Assert
            expect(cashOutStore.halfCashOut).toEqual(halfCashOut);
        });

        it("should call setHalfCashedOutValue()", () => {
            // Assert
            expect(cashOutHandlers["setHalfCashedOutValue"]).toBeCalled();
        });

        it("should update ratio of CrashCashOutStore", () => {
            // Assert
            expect(cashOutStore.ratio).toEqual(cashOutHandlers["halfCashOutRatio"]);
        });
    });

    describe("handleCashOutFull", () => {
        beforeEach(() => {
            // Arrange
            cashOutHandlers["hideCashOut"] = jest.fn();
            cashOutHandlers["handleCashOutMessage"] = jest.fn();

            // Act
            cashOutHandlers["handleCashOutFull"](cashOut);
        });

        it("should call handleCashOutMessage()", () => {
            // Assert
            expect(cashOutHandlers["handleCashOutMessage"]).toBeCalled();
        });

        it("should call setCashOutNotice() of CrashCashOutStore", () => {
            // Assert
            setTimeout(() => {
                expect(cashOutHandlers["hideCashOut"]).toBeCalled();
            }, cashOutHandlers["displayCashedOutDuration"]);
        });
    });

    describe("handleCashOutMessage", () => {
        beforeEach(() => {
            // Arrange
            cashOutHandlers["setFullCashedOutValue"] = jest.fn();
            cashOutHandlers["setHalfCashedOutValue"] = jest.fn();
        });

        it("should update cashOut of CrashCashOutStore", () => {
            // Act
            cashOutHandlers["handleCashOutMessage"](cashOut);

            // Assert
            expect(cashOutStore.cashOut).toEqual(cashOut);
        });

        it("should call setFullCashedOutValue()", () => {
            // Act
            cashOutHandlers["handleCashOutMessage"](cashOut);

            // Assert
            expect(cashOutHandlers["setFullCashedOutValue"]).toBeCalledWith(cashOut.cashOutWin);
        });

        describe("when have half cash out", () => {
            it("should not call setHalfCashedOutValue()", () => {
                // Arrange
                Object.defineProperty(cashOutStore, "isHalfCashedOut", { value: true, writable: true, configurable: true });

                // Act
                cashOutHandlers["handleCashOutMessage"](cashOut);

                // Assert
                expect(cashOutHandlers["setHalfCashedOutValue"]).not.toBeCalled();
            });
        });

        describe("when have not half cash out", () => {
            it("should call setHalfCashedOutValue()", () => {
                // Arrange
                Object.defineProperty(cashOutStore, "isHalfCashedOut", { value: false, writable: true, configurable: true });

                // Act
                cashOutHandlers["handleCashOutMessage"](cashOut);

                // Assert
                expect(cashOutHandlers["setHalfCashedOutValue"]).toBeCalled();
            });
        });
    });

    describe("setHalfCashedOutValue", () => {
        const value = 100;

        it("should update halfCashOutValue", () => {
            // Arrange

            // Act
            cashOutHandlers["setHalfCashedOutValue"](value);

            // Assert
            expect(cashOutStore.halfCashOutValue).toEqual(value);
        });
    });

    describe("setFullCashedOutValue", () => {
        const value = 100;

        it("should update fullCashOutValue", () => {
            // Arrange

            // Act
            cashOutHandlers["setFullCashedOutValue"](value);

            // Assert
            expect(cashOutStore.fullCashOutValue).toEqual(value);
        });
    });

    describe("hideCashOut", () => {
        it("should update ratio of CrashCashOutStore", () => {
            // Arrange

            // Act
            cashOutHandlers["hideCashOut"]();

            // Assert
            expect(cashOutStore.ratio).toEqual(cashOutHandlers["fullCashOutRatio"]);
        });

        it("should call changeButtonBetNextRound() of PlayerActionHandlers", () => {
            // Act
            cashOutHandlers["hideCashOut"]();

            // Assert
            expect(playerActionHandlers.changeButtonBetNextRound).toBeCalled();
        });
    });

    describe("handleMultiplier", () => {
        it("always call calculateWinAmount", () => {
            // Arrange
            cashOutHandlers["calculateWinAmount"] = jest.fn();

            // Act
            cashOutHandlers["handleMultiplier"]();

            // Assert
            expect(cashOutHandlers["calculateWinAmount"]).toBeCalledTimes(1);
        });

        describe("when winAmount is less than 0", () => {
            const winAmount = 0;

            beforeEach(() => {
                // Arrange
                cashOutHandlers["calculateWinAmount"] = jest.fn().mockReturnValueOnce(winAmount);
                cashOutHandlers["updateFullCashOutValue"] = jest.fn();
                cashOutHandlers["updateHalfCashOutValueByRatio"] = jest.fn();
            });

            it("should not update fullCashOutValue", () => {
                // Act
                cashOutHandlers["handleMultiplier"]();

                // Assert
                expect(cashOutHandlers["updateFullCashOutValue"]).not.toBeCalled();
            });

            it("should not update halfCashOutValue", () => {
                // Act
                cashOutHandlers["handleMultiplier"]();

                // Assert
                expect(cashOutHandlers["updateHalfCashOutValueByRatio"]).not.toBeCalled();
            });
        });

        describe("when winAmount is greater than 0", () => {
            const winAmount = 4.12;

            beforeEach(() => {
                // Arrange
                cashOutHandlers["calculateWinAmount"] = jest.fn().mockReturnValueOnce(winAmount);
                cashOutHandlers["updateFullCashOutValue"] = jest.fn();
                cashOutHandlers["updateHalfCashOutValueByRatio"] = jest.fn();
            });

            it("should update fullCashOutValue", () => {
                // Act
                cashOutHandlers["handleMultiplier"]();

                // Assert
                expect(cashOutHandlers["updateFullCashOutValue"]).toBeCalledWith(winAmount);
            });

            it("should update halfCashOutValue, when NOT full cash out", () => {
                // Arrange
                Object.defineProperty(cashOutStore, "isFullCashedOut", { value: false, configurable: true, writable: true });

                // Act
                cashOutHandlers["handleMultiplier"]();

                // Assert
                expect(cashOutHandlers["updateHalfCashOutValueByRatio"]).toBeCalledWith(winAmount);
            });

            it("should NOT update halfCashOutValue, when full cash out", () => {
                // Arrange
                Object.defineProperty(cashOutStore, "isFullCashedOut", { value: true, configurable: true, writable: true });

                // Act
                cashOutHandlers["handleMultiplier"]();

                // Assert
                expect(cashOutHandlers["updateHalfCashOutValueByRatio"]).not.toBeCalled();
            });
        });
    });

    describe("calculateWinAmount", () => {
        describe("when multiplier greater than 0", () => {
            it("should return 0", () => {
                // Arrange
                Object.defineProperty(multiplierStore, "multiplier", { value: 0, configurable: true, writable: true });

                // Act
                const actual = cashOutHandlers["calculateWinAmount"]();

                // Assert
                expect(actual).toBe(0);
            });
        });

        describe("when has bet amount", () => {
            beforeEach(() => {
                Object.defineProperty(multiplierStore, "multiplier", { value: 3, configurable: true, writable: true });
                Object.defineProperty(betInputStore, "betAmountRatio", { value: 0.5, configurable: true, writable: true });
            });

            it("should calculate by multiplier", () => {
                // Act
                const actual = cashOutHandlers["calculateWinAmount"]();

                // Assert
                expect(actual).toBe(1.5);
            });
        });
    });
    describe("handleOwnBets", () => {
        beforeEach(() => {
            cashOutHandlers["callHandleCrashed"] = jest.fn();
        });
        describe("when ownBets have HalfCashOut", () => {
            // Arrange
            const ownBets = {
                amount: 10,
                autoCashOut: 2,
                name: "abc",
                playerId: "abc",
                rate: 2,
                time: "10.12.34",
                halfCashOut: {
                    amount: 10,
                    win: 20,
                    multiplier: 2,
                    reachMaxWin: false,
                    cashOutWin: 20,
                },
            };

            it("should call handleHalfCashOutMessage()", () => {
                //Arrange
                cashOutHandlers["handleHalfCashOutMessage"] = jest.fn();

                //Act
                cashOutHandlers["handleOwnBets"](ownBets);

                //Assert
                expect(cashOutHandlers["handleHalfCashOutMessage"]).toBeCalled();
            });

            it("should set button state to CASH OUT", () => {
                //Act
                cashOutHandlers["handleOwnBets"](ownBets);

                //Assert
                expect(playerActionStore.buttonState).toEqual(ButtonState.CASH_OUT);
            });
        });

        describe("when ownBets have CashOut", () => {
            // Arrange
            const ownBets = {
                amount: 10,
                autoCashOut: 2,
                name: "abc",
                playerId: "abc",
                rate: 2,
                time: "10.12.34",
                cashOut: {
                    amount: 10,
                    win: 20,
                    multiplier: 2,
                    reachMaxWin: false,
                    cashOutWin: 20,
                },
            };

            it("should call handleCashOutMessage()", () => {
                //Arrange
                cashOutHandlers["handleCashOutMessage"] = jest.fn();

                //Act
                cashOutHandlers["handleOwnBets"](ownBets);

                //Assert
                expect(cashOutHandlers["handleCashOutMessage"]).toBeCalled();
            });

            it("should not call callHandleCrashed()", () => {
                //Arrange
                cashOutHandlers["callHandleCrashed"] = jest.fn();

                //Act
                cashOutHandlers["handleOwnBets"](ownBets);

                //Assert
                expect(cashOutHandlers["callHandleCrashed"]).not.toBeCalled();
            });

            it("should set button state to BET NEXT ROUND", () => {
                //Act
                cashOutHandlers["handleOwnBets"](ownBets);

                //Assert
                expect(playerActionStore.buttonState).toEqual(ButtonState.BET_NEXT_ROUND);
            });

            it("should set cashOutStore.ratio to fullCashOutRatio", () => {
                //Act
                cashOutHandlers["handleOwnBets"](ownBets);

                //Assert
                expect(cashOutStore.ratio).toEqual(cashOutHandlers["fullCashOutRatio"]);
            });
        });
    });

    describe("handleCrashed", () => {
        describe("when roundTime less than 10", () => {
            it("should call getLastRound()", () => {
                //Arrange
                Object.defineProperty(roundTimeStore, "isDisplayingResultState", { value: false, configurable: true, writable: true });
                Object.defineProperty(roundTimeStore, "isStartRound", { value: false, configurable: true, writable: true });
                roundTimeStore.roundTime = 8;

                //Act
                cashOutHandlers["handleCrashed"]();

                //Assert
                expect(playerActionStore.buttonState).not.toEqual(ButtonState.CASH_OUT);
            });
        });
        describe("when roundTime greater than 10", () => {
            beforeEach(() => {
                //Arrange3
                let lastRound: RoundHistory = { roundId: 123, result: [3], settlementResult: {} };

                roundHistoryStore.getLastRound = jest.fn(() => lastRound);
                Object.defineProperty(roundTimeStore, "isDisplayingResultState", { value: true, configurable: true, writable: true });
                Object.defineProperty(roundTimeStore, "isStartRound", { value: false, configurable: true, writable: true });
            });

            it("should call calculateWinAmount()", () => {
                //Arrange
                cashOutHandlers["calculateWinAmount"] = jest.fn();

                //Act
                const actual = cashOutHandlers["handleCrashed"]();

                //Assert
                expect(cashOutHandlers["calculateWinAmount"]).toBeCalled();
            });

            it("should call calculateWinAmount() twice", () => {
                //Arrange
                cashOutHandlers["calculateWinAmount"] = jest.fn();
                Object.defineProperty(cashOutStore, "isHalfCashedOut", { value: false, writable: true, configurable: true });

                //Act
                const actual = cashOutHandlers["handleCrashed"]();

                //Assert
                expect(cashOutHandlers["calculateWinAmount"]).toBeCalledTimes(2);
            });
        });
    });

    describe("resetCashOut", () => {
        it("should reset fullCashOutValue to 0", () => {
            // Arrange

            // Act
            cashOutHandlers["resetCashOut"]();

            // Assert
            expect(cashOutStore.fullCashOutValue).toBe(0);
        });

        it("should reset halfCashOutValue to 0", () => {
            // Arrange

            // Act
            cashOutHandlers["resetCashOut"]();

            // Assert
            expect(cashOutStore.halfCashOutValue).toBe(0);
        });

        it("should reset cashOut to null", () => {
            // Arrange

            // Act
            cashOutHandlers["resetCashOut"]();

            // Assert
            expect(cashOutStore.cashOut).toBe(null);
        });

        it("should reset halfCashOut to null", () => {
            // Arrange

            // Act
            cashOutHandlers["resetCashOut"]();

            // Assert
            expect(cashOutStore.halfCashOut).toBe(null);
        });

        it("should reset cashOutStore ratio to fullCashOutRatio", () => {
            // Arrange

            // Act
            cashOutHandlers["resetCashOut"]();

            // Assert
            expect(cashOutStore.ratio).toBe(cashOutHandlers["fullCashOutRatio"]);
        });
    });
});
