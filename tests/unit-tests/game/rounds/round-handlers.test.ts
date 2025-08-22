import { stub } from "jest-auto-stub";
import { GameConfigStore } from "../../../../src/game/game-configs";
import { MainPlayerStore } from "../../../../src/players";
import { GameServiceMessage } from "../../../../src/shared";
import { RoundHandlers } from "./../../../../src/game/rounds/round-handlers";
import { RoundStore } from "./../../../../src/game/rounds/round-store";

describe("RoundHandlers test", () => {
    let mainPlayerStore: MainPlayerStore;
    let configStore: GameConfigStore;
    let roundStore: RoundStore;

    beforeEach(() => {
        mainPlayerStore = stub<MainPlayerStore>();
        configStore = stub<GameConfigStore>();
        configStore.setGameConfigs = jest.fn();
        mainPlayerStore.setAuthorizeStore = jest.fn();
        roundStore = stub<RoundStore>();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("handleRoundId", () => {
        it("should call handleRoundId in RoundHandlers with roundID rather 0", () => {
            // Arrange
            const roundHandler = new RoundHandlers(roundStore);
            const expectRoundId = 1;

            // Act
            roundHandler.handleRoundId(expectRoundId);

            // Assert
            expect(roundStore.roundId).toEqual(expectRoundId);
        });

        it("should call handleRoundId in RoundHandlers with roundID less than or equal 1", () => {
            // Arrange
            const roundHandler = new RoundHandlers(roundStore);
            roundStore.roundId = 0;
            const expectRoundId = -1;

            // Act
            roundHandler.handleRoundId(expectRoundId);

            // Assert
            expect(roundStore.roundId).toEqual(0);
        });
    });
    describe("handleOwnBets", () => {
        it("should call handleOwnBets in RoundHandlers", () => {
            // Arrange
            const roundHandler = new RoundHandlers(roundStore);
            const expectOwnBets = {
                even: 2,
            };

            // Act
            roundHandler.handleOwnBets(expectOwnBets);

            // Assert
            expect(roundStore.ownBets).toEqual(expectOwnBets);
        });
    });
    describe("handleTotalBets", () => {
        it("should call handleTotalBets in RoundHandlers", () => {
            // Arrange
            const roundHandler = new RoundHandlers(roundStore);
            const expectOwnBets = {
                even: 2,
            };

            // Act
            roundHandler.handleTotalBets(expectOwnBets);

            // Assert
            expect(roundStore.totalBets).toEqual({ even: 2 });
        });
    });
    describe("handleResultHash", () => {
        it("should call handleResultHash in RoundHandlers", () => {
            // Arrange
            const roundHandler = new RoundHandlers(roundStore);
            const resultHash = new GameServiceMessage.ResultHash();

            // Act
            roundHandler.handleResultHash(resultHash);

            // Assert
            expect(roundStore.resultHash).toEqual(resultHash);
        });
    });

    describe("handleUserBetPercent", () => {
        it("should update userBetPercentage", () => {
            // Arrange
            const roundHandler = new RoundHandlers(roundStore);
            const data = stub<GameServiceMessage.UserBetPercentage>({
                even: 40,
                odd: 60,
            });

            // Act
            roundHandler.handleUserBetPercent(data);

            // Assert
            ["even", "odd"].forEach((key) => {
                expect(roundStore.userBetPercentage[key]).toEqual(data[key]);
            });
        });
    });
});
