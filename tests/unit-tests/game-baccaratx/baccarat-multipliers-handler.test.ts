import { stub } from "jest-auto-stub";
import { MultipliersStore } from "../../../src/features/multipliers/multipliers-store";
import { BetChoice, Card } from "../../../src/game-baccaratx/baccarat-defines";
import { BaccaratMultipliersHandler, BaccaratMultipliersStore } from "../../../src/game-baccaratx/multiplier";
import { GameConfigStore } from "../../../src/game/game-configs/game-config-store";
import { RoundTimeStore } from "../../../src/game/rounds";
import { GameServiceMessage } from "../../../src/shared";
describe("BaccaratMultipliersHandler", () => {
    let handler: BaccaratMultipliersHandler;
    let multipliersStore: MultipliersStore<Card>;

    let gameConfigStore: GameConfigStore;
    let roundTimeStore: RoundTimeStore;
    let baccaratMultipliersStore: BaccaratMultipliersStore<Card>;
    beforeEach(() => {
        multipliersStore = stub<MultipliersStore<Card>>();
        gameConfigStore = stub<GameConfigStore>();
        roundTimeStore = stub<RoundTimeStore>();
        baccaratMultipliersStore = stub<BaccaratMultipliersStore<Card>>();
        handler = new BaccaratMultipliersHandler(multipliersStore, gameConfigStore, baccaratMultipliersStore, roundTimeStore);
    });

    describe("receivedFinaleOdds", () => {
        it("should store finalOdds", () => {
            //Arrange
            const finalOdds = {
                banker: 12,
                bankerPair: 24,
            };
            baccaratMultipliersStore.finalOdds = {};

            //Act
            handler.receivedFinaleOdds({ finalOdds });

            //Assert
            expect(baccaratMultipliersStore.finalOdds).toBe(finalOdds);
        });
    });

    describe("openCards", () => {
        beforeEach(() => {
            baccaratMultipliersStore.betChoices = ["aaa", "bbb", "ccc"];
            handler.getCards = jest.fn();
            handler.getMultipliersValues = jest.fn();
            handler.updatePossiblePayout = jest.fn();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it("should call getCards for each choice", () => {
            //Arrange
            const cardsState = {};

            //Act
            handler.openCards(cardsState);

            //Assert
            expect(handler.getCards).toBeCalledTimes(baccaratMultipliersStore.betChoices.length);
        });

        it("should call getMultipliersValues for each choice", () => {
            //Arrange
            const cardsState = {};

            //Act
            handler.openCards(cardsState);

            //Assert
            expect(handler.getMultipliersValues).toBeCalledTimes(baccaratMultipliersStore.betChoices.length);
        });

        it("should call updatePossiblePayout for each choice", () => {
            //Arrange
            const cardsState = {};

            //Act
            handler.openCards(cardsState);

            //Assert
            expect(handler.updatePossiblePayout).toBeCalledTimes(baccaratMultipliersStore.betChoices.length);
        });
    });

    describe("registerBetChoices", () => {
        it("should register betChoices", () => {
            //Arrange
            const betChoices = ["aaa", "bbb", "ccc"];
            baccaratMultipliersStore.betChoices = [];

            //Act
            handler.registerBetChoices(betChoices);

            //Assert
            expect(baccaratMultipliersStore.betChoices).toBe(betChoices);
        });
    });

    describe("convertOddsMultipliers", () => {
        it("should update possiblePayout", () => {
            //Arrange
            const oddsMultipliers = [
                stub<GameServiceMessage.BaccaratCardMultiplier>(),
                stub<GameServiceMessage.BaccaratCardMultiplier>(),
                stub<GameServiceMessage.BaccaratCardMultiplier>(),
            ];
            //Act
            handler.convertOddsMultipliers(oddsMultipliers);

            //Assert
            const expectedResult = [
                { item: { rank: oddsMultipliers[0].rank, suit: oddsMultipliers[0].suit }, value: oddsMultipliers[0].value },
                { item: { rank: oddsMultipliers[1].rank, suit: oddsMultipliers[1].suit }, value: oddsMultipliers[1].value },
                { item: { rank: oddsMultipliers[2].rank, suit: oddsMultipliers[2].suit }, value: oddsMultipliers[2].value },
            ];
            expect(multipliersStore.multipliers).toEqual(expectedResult);
        });
    });

    describe("getMultipliersValues", () => {
        it("should return values for matched cards", () => {
            //Arrange
            multipliersStore.multipliers = [
                {
                    item: { rank: 1, suit: 1 },
                    value: 2,
                },
                {
                    item: { rank: 3, suit: 1 },
                    value: 4,
                },
                {
                    item: { rank: 5, suit: 1 },
                    value: 6,
                },
            ];
            const cards = [
                { rank: 1, suit: 1 }, //matched
                { rank: 2, suit: 1 },
                { rank: 3, suit: 1 }, //matched
                { rank: 4, suit: 1 },
            ];
            //Act
            const result = handler.getMultipliersValues(cards);

            //Assert
            const expectedResult = [2, 4];
            expect(result).toEqual(expectedResult);
        });
    });

    describe("getCards", () => {
        describe("bet choice pair", () => {
            it("should return 2 cards, for pair", () => {
                //Arrange
                const first2Card = [
                    { rank: 1, suit: 0 },
                    { rank: 1, suit: 1 },
                ];
                const cardsState = {
                    banker: [...first2Card, { rank: 2, suit: 1 }],
                };
                //Act
                const result = handler.getCards(cardsState, BetChoice.BankerPair);

                //Assert
                expect(result.length).toEqual(2);
                expect(result).toEqual(first2Card);
            });

            it("should return 0 cards, when not pair", () => {
                //Arrange
                const first2Card = [
                    { rank: 1, suit: 0 },
                    { rank: 2, suit: 1 },
                ];
                const cardsState = {
                    banker: [...first2Card, { rank: 2, suit: 1 }],
                };
                //Act
                const result = handler.getCards(cardsState, BetChoice.BankerPair);

                //Assert
                expect(result.length).toEqual(0);
            });

            it("should return 1 cards, when only one card", () => {
                //Arrange
                const first2Card = [{ rank: 1, suit: 0 }];
                const cardsState = {
                    banker: [...first2Card],
                };
                //Act
                const result = handler.getCards(cardsState, BetChoice.BankerPair);

                //Assert
                expect(result.length).toEqual(1);
            });
        });

        describe("bet choice tie", () => {
            it("should return 4 cards, for tie", () => {
                //Arrange
                const cardsState = {
                    banker: [
                        { rank: 1, suit: 0 },
                        { rank: 1, suit: 1 },
                    ],
                    player: [
                        { rank: 1, suit: 2 },
                        { rank: 1, suit: 3 },
                    ],
                };
                //Act
                const result = handler.getCards(cardsState, BetChoice.Tie);

                //Assert
                const expectedResult = [...cardsState.banker, ...cardsState.player];
                expect(result.length).toEqual(4);
                expect(result).toEqual(expectedResult);
            });

            it("should return 6 cards, for tie", () => {
                //Arrange
                const cardsState = {
                    banker: [
                        { rank: 1, suit: 0 },
                        { rank: 1, suit: 1 },
                        { rank: 2, suit: 1 },
                    ],
                    player: [
                        { rank: 1, suit: 2 },
                        { rank: 1, suit: 3 },
                        { rank: 2, suit: 3 },
                    ],
                };
                //Act
                const result = handler.getCards(cardsState, BetChoice.Tie);

                //Assert
                const expectedResult = [...cardsState.banker, ...cardsState.player];
                expect(result.length).toEqual(6);
                expect(result).toEqual(expectedResult);
            });

            // it("should return 0 cards, when cards length different", () => {
            //     //Arrange
            //     const cardsState = {
            //         banker: [{ rank: 1, suit: 0 }],
            //         player: [
            //             { rank: 1, suit: 2 },
            //             { rank: 1, suit: 3 },
            //         ],
            //     };
            //     //Act
            //     const result = handler.getCards(cardsState, BetChoice.Tie);

            //     //Assert
            //     expect(result.length).toEqual(0);
            // });

            // it("should return 0 cards, when score different", () => {
            //     //Arrange
            //     const cardsState = {
            //         banker: [
            //             { rank: 1, suit: 0 },
            //             { rank: 3, suit: 1 },
            //             { rank: 2, suit: 1 },
            //         ],
            //         player: [
            //             { rank: 1, suit: 2 },
            //             { rank: 1, suit: 3 },
            //             { rank: 2, suit: 3 },
            //         ],
            //     };
            //     //Act
            //     const result = handler.getCards(cardsState, BetChoice.Tie);

            //     //Assert
            //     expect(result.length).toEqual(0);
            // });
        });
    });

    describe("updatePossiblePayout", () => {
        it("should update possiblePayout", () => {
            //Arrange
            baccaratMultipliersStore.possiblePayout = {};
            const betChoice = "player";
            const multiplierValues = [2.2, 3];
            const fractionalOdds = 0.96;
            //Act
            handler.updatePossiblePayout(betChoice, multiplierValues, fractionalOdds);

            //Assert
            const expectedValue = fractionalOdds * multiplierValues[0] * multiplierValues[1] + 1;
            expect(baccaratMultipliersStore.possiblePayout[betChoice].multipliers).toEqual(multiplierValues);
            expect(baccaratMultipliersStore.possiblePayout[betChoice].value).toEqual(expectedValue);
        });
    });

    describe("isSameCard", () => {
        it("should return true, when same rank and suit", () => {
            //Arrange
            const cardA = { rank: 1, suit: 0 };
            const cardB = { rank: 1, suit: 0 };
            //Act
            const result = handler.isSameCard(cardA, cardB);

            //Assert
            expect(result).toEqual(true);
        });

        it("should return false, when rank different", () => {
            //Arrange
            const cardA = { rank: 1, suit: 0 };
            const cardB = { rank: 2, suit: 0 };
            //Act
            const result = handler.isSameCard(cardA, cardB);

            //Assert
            expect(result).toEqual(false);
        });

        it("should return false, when suit different", () => {
            //Arrange
            const cardA = { rank: 1, suit: 0 };
            const cardB = { rank: 1, suit: 1 };
            //Act
            const result = handler.isSameCard(cardA, cardB);

            //Assert
            expect(result).toEqual(false);
        });
    });
});
