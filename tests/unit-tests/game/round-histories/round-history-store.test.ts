import { stub } from "jest-auto-stub";
import { GameSetting } from "../../../../src/game/game-configs";
import { RoundHistory, RoundHistoryStore } from "../../../../src/game/round-histories";
import { ROUND_STATE, RoundTimeStore } from "../../../../src/game/rounds";
import { SettlementStore } from "../../../../src/game/settlements/settlement-store";

jest.mock("mobx");

describe("RoundHistoryStore", () => {
    let roundHistoryStore: RoundHistoryStore;
    let roundTimeStoreMock: RoundTimeStore;
    let mockHistories: RoundHistory[];
    let gameSetting: GameSetting;
    let settlementStore: SettlementStore;

    beforeEach(() => {
        roundTimeStoreMock = stub<RoundTimeStore>();
        gameSetting = stub<GameSetting>();
        settlementStore = stub<SettlementStore>();

        roundHistoryStore = new RoundHistoryStore(roundTimeStoreMock, gameSetting, settlementStore);
        mockHistories = [
            {
                roundId: 1,
                result: {
                    red1: false,
                    red2: false,
                    red3: true,
                    red4: true,
                },
                settlementResult: {
                    odd: false,
                    even: true,
                    red2: true,
                    red3: false,
                    red4: false,
                    white3: false,
                    white4: false,
                },
            },
        ];
    });

    describe("insertNewRound", () => {
        it("should not update histories when currentRound has the same roundId as the lastRound", () => {
            // arrange
            const histories = [
                {
                    roundId: 1,
                    result: {
                        red: true,
                    },
                    settlementResult: {
                        red: true,
                    },
                },
            ];
            roundHistoryStore.histories = histories;
            const currentRound = {
                roundId: 1,
                result: {
                    red: true,
                },
                settlementResult: {
                    red: true,
                },
            };

            // Act
            roundHistoryStore.insertNewRound(currentRound);

            // Assert
            expect(roundHistoryStore.histories).toEqual(histories);
        });
        it("should update histories correctly when numberOfRoundHistory is greater than 0", () => {
            // Arrange
            gameSetting.numberOfRoundHistory = 3;
            const finish = {
                roundId: 1,
                result: {
                    red: true,
                },
                settlementResult: {
                    red: true,
                },
            };

            // Act
            roundHistoryStore.insertNewRound(finish);

            // Assert
            expect(roundHistoryStore.histories).toEqual([finish]);
        });

        it("roundHistoryStore.histories = 0 when numberOfRoundHistory is 0", () => {
            // Arrange
            gameSetting.numberOfRoundHistory = 0;
            const finish = {
                roundId: 1,
                result: {
                    red: true,
                },
                settlementResult: {
                    red: true,
                },
            };

            // Act
            roundHistoryStore.insertNewRound(finish);

            // Assert
            expect(roundHistoryStore.histories).toEqual([]);
        });
    });

    describe("insertNewRound", () => {
        const initialHistories = [
            {
                roundId: 1,
                result: {
                    red: true,
                },
                settlementResult: {
                    red: true,
                },
            },
            {
                roundId: 2,
                result: {
                    red: true,
                },
                settlementResult: {
                    red: true,
                },
            },
        ];
        const finish = {
            roundId: 3,
            result: {
                red: true,
            },
            settlementResult: {
                red: true,
            },
        };

        beforeEach(() => {
            roundHistoryStore.histories = [...initialHistories];
            gameSetting.numberOfRoundHistory = 3;
        });

        it("should update histories correctly when numberOfRoundHistory is greater than the length of histories", () => {
            // Act
            roundHistoryStore.insertNewRound(finish);

            // Assert
            expect(roundHistoryStore.histories).toEqual([finish, ...initialHistories]);
        });

        it("should update histories correctly when numberOfRoundHistory is less than or equal to the length of histories", () => {
            // Arrange
            gameSetting.numberOfRoundHistory = 2;

            // Act
            roundHistoryStore.insertNewRound(finish);

            // Assert
            expect(roundHistoryStore.histories.length).toBe(gameSetting.numberOfRoundHistory);
            expect(roundHistoryStore.histories).toEqual([finish, initialHistories[0]]);
        });
    });

    describe("isValidHistories", () => {
        it("returns false when _histories is empty", () => {
            // Arrange
            roundHistoryStore.histories = []; // Set _histories to an empty array

            // Act
            const result = roundHistoryStore.isValidHistories;

            // Assert
            expect(result).toBe(false);
        });

        it("returns false when roundState is STOP_GAME_LOOP", () => {
            // Arrange
            roundTimeStoreMock.roundState = ROUND_STATE.STOP_GAME_LOOP;

            // Act
            const result = roundHistoryStore.isValidHistories;

            // Assert
            expect(result).toBe(false);
        });

        it("returns true when _histories is not empty and roundState is not STOP_GAME_LOOP", () => {
            // Arrange
            roundHistoryStore.histories = [
                {
                    roundId: 1,
                    result: {
                        choice: 1,
                    },
                    settlementResult: {
                        test: true,
                    },
                },
            ];
            roundTimeStoreMock.roundState = ROUND_STATE.START_GAME_LOOP;
            //@ts-ignore
            roundHistoryStore._receivedInGame = true;

            // Act
            const result = roundHistoryStore.isValidHistories;

            // Assert
            expect(result).toBe(true);
        });
    });
});
