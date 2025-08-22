import { stub } from "jest-auto-stub";
import { DisabledGameStore } from "../../../../src/game/disabled-game/disabled-game-store";
import { GameSetting } from "../../../../src/game/game-configs";
import { RoundRunningHandlers } from "../../../../src/game/rounds";
import { RoundTimeStore } from "../../../../src/game/rounds/round-time-store";
import { GameServiceMessage } from "../../../../src/shared";
import { RoundTimeHandlers } from "./../../../../src/game/rounds/round-time-handlers";
import { gameSettings } from "./../../container.test";

describe("RoundTimeHandlers", () => {
    let roundTimeStore: RoundTimeStore;
    let roundTimeHandler: RoundTimeHandlers;
    let gameSetting: GameSetting;
    let roundRunningHandlers: RoundRunningHandlers;
    let disabledGameStore: DisabledGameStore;

    beforeEach(() => {
        gameSetting = new GameSetting();
        gameSetting.name = gameSettings.name;
        gameSetting.durations = gameSettings.durations;
        roundTimeStore = new RoundTimeStore(gameSetting);
        roundRunningHandlers = stub<RoundRunningHandlers>();
        disabledGameStore = stub<DisabledGameStore>();
        roundTimeHandler = new RoundTimeHandlers(roundTimeStore, roundRunningHandlers, disabledGameStore);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    describe("handleRemainingTime", () => {
        it("should update store round time and start store", () => {
            // Arrange
            roundTimeStore.start = jest.fn();
            roundRunningHandlers.startRunner = jest.fn();
            roundRunningHandlers.stopRunner = jest.fn();
            disabledGameStore.disabled = false;

            // Act
            roundTimeHandler.handleRemainingTime(5);

            // Assert
            expect(roundTimeStore.roundTime).toBe(5);
            expect(roundRunningHandlers.startRunner).toBeCalled();
            expect(roundRunningHandlers.stopRunner).toBeCalled();
        });

        it("should not update store round time and start store when remaining time is 0", () => {
            // Arrange
            roundTimeStore.start = jest.fn();

            // Act
            roundTimeHandler.handleRemainingTime(0);

            // Assert
            expect(roundTimeStore.roundTime).toEqual(0);
            expect(roundTimeStore.start).not.toHaveBeenCalled();
        });
    });

    describe("handleStartNewRoundStatus", () => {
        it("should update store start new round status", () => {
            // Act
            roundTimeHandler.handleStartNewRoundStatus(true);

            // Assert
            expect(roundTimeStore.startNewRound).toBe(true);
        });
    });

    describe("handleStartPlacingBetStatus", () => {
        it("should update store start placing bet status", () => {
            // Act
            roundTimeHandler.handleStartPlacingBetStatus(true);

            // Assert
            expect(roundTimeStore.startPlacingBet).toBe(true);
        });
    });

    describe("handleEndPlacingBetStatus", () => {
        it("should update store end placing bet status", () => {
            // Act
            roundTimeHandler.handleEndPlacingBetStatus(true);

            // Assert
            expect(roundTimeStore.endPlacingBet).toBe(true);
        });
    });

    describe("handleEndRoundStatus", () => {
        it("should update store end round and reset placing bet statuses", () => {
            // Act
            roundTimeHandler.handleEndRoundStatus(new GameServiceMessage.Finish());

            // Assert
            expect(roundTimeStore.endRound).toBe(true);
            expect(roundTimeStore.endPlacingBet).toBe(false);
            expect(roundTimeStore.startPlacingBet).toBe(false);
        });

        it("should not update store end round and reset placing bet statuses when finish is undefined", () => {
            // Act
            roundTimeHandler.handleEndRoundStatus(undefined);

            // Assert
            expect(roundTimeStore.endRound).toBe(false);
            expect(roundTimeStore.endPlacingBet).toBe(false);
            expect(roundTimeStore.startPlacingBet).toBe(false);
        });
    });

    it("eventHandleList should contain all the required message events and their respective handlers", () => {
        // arrange
        const expectedEventHandleList = [
            {
                name: GameServiceMessage.remainingTime,
                handle: roundTimeHandler.handleRemainingTime,
            },
            {
                name: GameServiceMessage.snr,
                handle: roundTimeHandler.handleStartNewRoundStatus,
            },
            {
                name: GameServiceMessage.spb,
                handle: roundTimeHandler.handleStartPlacingBetStatus,
            },
            {
                name: GameServiceMessage.epb,
                handle: roundTimeHandler.handleEndPlacingBetStatus,
            },
            {
                name: GameServiceMessage.Finish.eventName,
                handle: roundTimeHandler.handleEndRoundStatus,
            },
        ];

        // Assert
        expect(roundTimeHandler.eventHandleList).toEqual(expectedEventHandleList);
    });
});
