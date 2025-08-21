import { GameSetting } from "../../../../src/game/game-configs";
import { ROUND_STATE, RoundTimeStore } from "../../../../src/game/rounds/round-time-store";

describe("RoundTimeStore Unit Tests", () => {
    let roundTimeStore: RoundTimeStore;
    let gameSetting = new GameSetting();

    const setting = {
        wholeRound: 39,
        placingBet: 30,
        lockingBet: 5,
        generatingResult: 2,
        startRound: 1,
    };

    gameSetting.durations = setting;

    beforeEach(() => {
        roundTimeStore = new RoundTimeStore(gameSetting);
    });

    it("should be able to count down the round time", () => {
        // Arrange
        roundTimeStore.roundTime = roundTimeStore.wholeRound;

        // Act
        roundTimeStore.countdown();

        // Assert
        expect(roundTimeStore.roundTime).toEqual(roundTimeStore.wholeRound - 1);
    });

    describe("countdown", () => {
        it("should set roundTime to 0 if it is less than or equal to 1", () => {
            // Arrange
            roundTimeStore.roundTime = 1;

            // Act
            roundTimeStore.countdown();

            // Assert
            expect(roundTimeStore.roundTime).toBe(0);
        });

        it("should decrement roundTime by 1 if it is greater than 1", () => {
            // Arrange
            roundTimeStore.roundTime = 5;

            // Act
            roundTimeStore.countdown();

            // Assert
            expect(roundTimeStore.roundTime).toBe(4);
        });

        it("should call calculateRoundStatus method", () => {
            // Arrange
            roundTimeStore.roundTime = 5;

            roundTimeStore.calculateRoundStatus = jest.fn();

            // Act
            roundTimeStore.countdown();

            // Assert
            expect(roundTimeStore.calculateRoundStatus).toHaveBeenCalled();
        });
    });

    describe("roundState", () => {
        it("should return the value of _roundState", () => {
            // Arrange
            const expectedState = "START_GAME_LOOP";

            roundTimeStore.roundState = expectedState;

            // Act
            const result = roundTimeStore.roundState;

            // Assert
            expect(result).toBe(expectedState);
        });
    });

    describe("isWaiting", () => {
        it("should return true if roundTime is greater than placingBet and wholeRound is not equal to 0", () => {
            // Arrange
            roundTimeStore.roundTime = 7;
            gameSetting.durations = { ...setting, placingBet: 5, wholeRound: 2 };

            // Assert
            expect(roundTimeStore.isWaiting).toBeTruthy();
        });
        it("should return false if roundTime is less than or equal to placingBet", () => {
            // Arrange
            roundTimeStore.roundTime = 5;
            gameSetting.durations = { ...setting, placingBet: 7, wholeRound: 2 };

            // Assert
            expect(roundTimeStore.isWaiting).toBeFalsy();
        });
    });

    describe("isStartWaiting", () => {
        it("should return true if roundTime is equal to wholeRound and wholeRound is not equal to 0", () => {
            // Arrange
            roundTimeStore.roundTime = 2;
            gameSetting.durations = { ...setting, wholeRound: 2 };

            // Assert
            expect(roundTimeStore.isStartWaiting).toBeTruthy();
        });
        it("should return false if roundTime is less than or greater than wholeRound", () => {
            // Arrange
            roundTimeStore.roundTime = 3;
            gameSetting.durations = { ...setting, wholeRound: 2 };

            // Assert
            expect(roundTimeStore.isStartWaiting).toBeFalsy();
        });
        it("should return false if wholeRound is equal to 0", () => {
            // Arrange
            roundTimeStore.roundTime = 2;
            gameSetting.durations = { ...setting, wholeRound: 0 };

            // Assert
            expect(roundTimeStore.isStartWaiting).toBeFalsy();
        });
    });

    describe("isLocking", () => {
        it("should return true when roundTime is less than or equal to lockingBet and wholeRound is not zero", () => {
            // Arrange
            roundTimeStore.roundTime = 1;
            gameSetting.durations = { ...setting, wholeRound: 1 };

            // Assert
            expect(roundTimeStore.isLocking).toBeTruthy();
        });

        it("should return false when roundTime is greater than lockingBet", () => {
            // Arrange
            roundTimeStore.roundTime = 20;
            gameSetting.durations = { ...setting, wholeRound: 1 };

            // Assert
            expect(roundTimeStore.isLocking).toBeFalsy();
        });
    });

    describe("isStartLocking", () => {
        it("should return true when roundTime equals lockingBet and wholeRound is not zero", () => {
            // Arrange
            roundTimeStore.roundTime = 5;
            gameSetting.durations = { ...setting, wholeRound: 1 };

            // Assert
            expect(roundTimeStore.isStartLocking).toBeTruthy();
        });

        it("should return false when roundTime does not equal lockingBet", () => {
            // Arrange
            roundTimeStore.roundTime = 20;
            gameSetting.durations = { ...setting, wholeRound: 1 };

            // Assert
            expect(roundTimeStore.isStartLocking).toBeFalsy();
        });
    });

    describe("isPlacingBet", () => {
        it("should return true if roundTime is <= placingBet AND roundTime is > lockingBet AND wholeRound is not equal to 0", () => {
            // Arrange
            roundTimeStore.roundTime = 6;

            // Assert
            expect(roundTimeStore.isPlacingBet).toBeTruthy();
        });

        it("should return false if roundTime is > placingBet OR roundTime is <= lockingBet OR wholeRound is equal to 0", () => {
            // Arrange
            roundTimeStore.roundTime = 35;

            // Assert
            expect(roundTimeStore.isPlacingBet).toBeFalsy();
        });
    });

    describe("isStartPlacingBet", () => {
        it("should return true if roundTime is equal to placingBet AND wholeRound is not equal to 0", () => {
            // Arrange
            roundTimeStore.roundTime = 30;

            // Assert
            expect(roundTimeStore.isStartPlacingBet).toBeTruthy();
        });

        it("should return false if roundTime is not equal to placingBet OR wholeRound is equal to 0", () => {
            // Arrange
            roundTimeStore.roundTime = 5;

            // Assert
            expect(roundTimeStore.isStartPlacingBet).toBeFalsy();
        });
    });

    describe("isShowResult", () => {
        it("should return true when round time is less than (wholeRound - genResult) and greater than placing bet", () => {
            roundTimeStore.roundTime = 10;
            gameSetting.durations = { ...setting, wholeRound: 20, generatingResult: 5, placingBet: 5 };
            expect(roundTimeStore.isShowResult).toBeTruthy();
        });

        it("should return true when round time equals (wholeRound - genResult)", () => {
            roundTimeStore.roundTime = 15;
            gameSetting.durations = { ...setting, wholeRound: 20, generatingResult: 5, placingBet: 5 };
            expect(roundTimeStore.isShowResult).toBeTruthy();
        });

        it("should return false when round time equals placing bet", () => {
            roundTimeStore.roundTime = 5;
            gameSetting.durations = { ...setting, wholeRound: 20, generatingResult: 5, placingBet: 5 };
            expect(roundTimeStore.isShowResult).toBeFalsy();
        });

        it("should return false when round time is greater than (wholeRound - genResult)", () => {
            roundTimeStore.roundTime = 18;
            gameSetting.durations = { ...setting, wholeRound: 20, generatingResult: 5, placingBet: 5 };
            expect(roundTimeStore.isShowResult).toBeFalsy();
        });
    });

    describe("isStartRound", () => {
        it("should return true if roundTime equals placingBet plus startRound", () => {
            // Arrange
            roundTimeStore.roundTime = 32;
            gameSetting.durations = { ...setting, placingBet: 30, startRound: 2 };

            // Act
            const result = roundTimeStore.isStartRound;

            // Assert
            expect(result).toBe(true);
        });

        it("should return false if roundTime does not equal placingBet plus startRound", () => {
            // Arrange
            roundTimeStore.roundTime = 31;
            gameSetting.durations = { ...setting, placingBet: 30, startRound: 2 };

            const result = roundTimeStore.isStartRound;

            // Assert
            expect(result).toBe(false);
        });
    });

    describe("isStartingRound", () => {
        it("should return true if roundTime is equal to placingBet + startRound", () => {
            // Arrange
            roundTimeStore.roundTime = 10;
            gameSetting.durations = { ...setting, startRound: 2, placingBet: 8 };

            // Act
            const result = roundTimeStore.isStartingRound;

            // Assert
            expect(result).toBe(true);
        });

        it("should return false if roundTime is less than placingBet + startRound", () => {
            // Arrange
            roundTimeStore.roundTime = 5;

            // Act
            const result = roundTimeStore.isStartingRound;

            // Assert
            expect(result).toBe(false);
        });

        it("should return false if roundTime is greater than placingBet + startRound", () => {
            // Arrange
            roundTimeStore.roundTime = 35;
            gameSetting.durations = { ...setting, startRound: 2, placingBet: 30 };

            // Act
            const result = roundTimeStore.isStartingRound;

            // Assert
            expect(result).toBe(false);
        });
    });

    describe("isTimeOut", () => {
        it("should return true if roundTime is 0", () => {
            // Arrange
            roundTimeStore.roundTime = 0;

            // Act
            const result = roundTimeStore.isTimeOut;

            // Assert
            expect(result).toBe(true);
        });

        it("should return false if roundTime is not 0", () => {
            // Arrange
            roundTimeStore.roundTime = 10;

            // Act
            const result = roundTimeStore.isTimeOut;

            // Assert
            expect(result).toBe(false);
        });
    });

    describe("isInRoundTime", () => {
        const testCases = [
            { roundState: ROUND_STATE.PLACING_BET, expected: true },
            { roundState: ROUND_STATE.LOCKING_BET, expected: true },
            { roundState: ROUND_STATE.SHOW_RESULT, expected: false },
            { roundState: ROUND_STATE.STARTING_ROUND, expected: false },
        ];

        it.each(testCases)("should return %p when roundState is %p", ({ roundState, expected }) => {
            // Arrange
            roundTimeStore.roundState = roundState;

            // Act
            const result = roundTimeStore.isInRoundTime;

            // Assert
            expect(result).toBe(expected);
        });
    });

    describe("isDisplayingResultState", () => {
        const testCases = [
            {
                roundState: ROUND_STATE.SHOW_ANIMATION_RESULT,
                expected: true,
            },
            {
                roundState: ROUND_STATE.SHOW_RESULT,
                expected: true,
            },
            {
                roundState: ROUND_STATE.STOP_GAME_LOOP,
                expected: true,
            },
            {
                roundState: ROUND_STATE.STARTING_ROUND,
                expected: false,
            },
            {
                roundState: ROUND_STATE.PLACING_BET,
                expected: false,
            },
            {
                roundState: ROUND_STATE.LOCKING_BET,
                expected: false,
            },
        ];

        test.each(testCases)("returns %s when roundState is %s", ({ roundState, expected }) => {
            // Arrange
            roundTimeStore.roundState = roundState;

            // Act
            const result = roundTimeStore.isDisplayingResultState;

            // Assert
            expect(result).toBe(expected);
        });
    });

    describe("calculateRoundStatus", () => {
        test("set round state to WAITING if round time is negative", () => {
            // Arrange
            roundTimeStore.roundTime = -1;

            // Act
            roundTimeStore.calculateRoundStatus();

            // Assert
            expect(roundTimeStore.roundState).toBe(ROUND_STATE.WAITING);
        });

        describe("check round state is SHOW_ANIMATION_RESULT", () => {
            test("set round state to SHOW_ANIMATION_RESULT if isShowAnimationResult is true (roundTime=0)`", () => {
                // Arrange
                roundTimeStore.roundTime = 0;

                // Act
                roundTimeStore.calculateRoundStatus();

                // Assert
                expect(roundTimeStore.roundState).toBe(ROUND_STATE.SHOW_ANIMATION_RESULT);
            });

            for (let roundTime = setting.wholeRound + 2 - setting.generatingResult; roundTime <= setting.wholeRound; roundTime++) {
                test(`set round state to SHOW_ANIMATION_RESULT if isShowAnimationResult is true (roundTime=${roundTime})`, () => {
                    // Arrange
                    roundTimeStore.roundTime = roundTime;

                    // Act
                    roundTimeStore.calculateRoundStatus();

                    // Assert
                    expect(roundTimeStore.roundState).toBe(ROUND_STATE.SHOW_ANIMATION_RESULT);
                });
            }
        });

        describe("check round state is LOCKING_BET", () => {
            for (let roundTime = 1; roundTime <= setting.lockingBet; roundTime++) {
                test(`set round state to LOCKING_BET if isLocking is true (roundTime=${roundTime})`, () => {
                    // Arrange
                    roundTimeStore.roundTime = roundTime;

                    // Act
                    roundTimeStore.calculateRoundStatus();

                    // Assert
                    expect(roundTimeStore.roundState).toBe(ROUND_STATE.LOCKING_BET);
                });
            }
        });

        describe("check round state is SHOW_RESULT ", () => {
            for (
                let roundTime = setting.placingBet + setting.startRound + 1;
                roundTime <= setting.wholeRound - setting.generatingResult + 1;
                roundTime++
            ) {
                test(`set round state to SHOW_RESULT if isShowResult is true (roundTime=${roundTime})`, () => {
                    // Arrange
                    roundTimeStore.roundTime = roundTime;

                    // Act
                    roundTimeStore.calculateRoundStatus();

                    // Assert
                    expect(roundTimeStore.roundState).toBe(ROUND_STATE.SHOW_RESULT);
                });
            }
        });

        test("set round state to STARTING_ROUND if isStartingRound is true", () => {
            // Arrange
            roundTimeStore.roundTime = setting.placingBet + setting.startRound;

            // Act
            roundTimeStore.calculateRoundStatus();

            // Assert
            expect(roundTimeStore.roundState).toBe(ROUND_STATE.STARTING_ROUND);
        });

        describe("check round state is PLACING_BET", () => {
            for (let roundTime = setting.lockingBet + 1; roundTime <= setting.placingBet; roundTime++) {
                test(`set round state to PLACING_BET if isPlacingBet is true (roundTime=${roundTime})`, () => {
                    // Arrange
                    roundTimeStore.roundTime = roundTime;

                    // Act
                    roundTimeStore.calculateRoundStatus();

                    // Assert
                    expect(roundTimeStore.roundState).toBe(ROUND_STATE.PLACING_BET);
                });
            }
        });
    });

    describe("ShowStartBetMessage", () => {
        test("isShowStartBetMessage is true within the specified time range", () => {
            // Arrange
            roundTimeStore.roundTime = 31;

            // Assert
            expect(roundTimeStore.isShowStartBetMessage).toBe(true);
        });

        test("isShowStartBetMessage is false outside the specified time range", () => {
            // Arrange
            roundTimeStore.roundTime = 35;

            // Assert
            expect(roundTimeStore.isShowStartBetMessage).toBe(false);
        });

        test("isShowStartBetMessage is true within the specified time range and update duration from game setting", () => {
            // Arrange
            const durationShowPromptMessage = 3;
            roundTimeStore.roundTime = 32;

            // Act
            roundTimeStore.setDurationShowPromptMessage(durationShowPromptMessage);

            // Assert
            expect(roundTimeStore.isShowStartBetMessage).toBe(true);
        });
    });
});
