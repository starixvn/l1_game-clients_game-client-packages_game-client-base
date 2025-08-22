import { stub } from "jest-auto-stub";
import { NoticeStore } from "../../../src/game/notices/notice-store";
import { MainPlayerStore } from "../../../src/players/main-player-store";
import { Translator } from "../../../src/shared/utils";

jest.mock("../../../src/shared/utils/localization-manager", () => {
    return {
        Translator: {
            translate: jest.fn(),
            gameTranslate: jest.fn(),
            commonTranslate: jest.fn().mockImplementation((key, option) => key),
        },
    };
});

describe("MainPlayerStore", () => {
    let mainPlayerStore: MainPlayerStore;
    let noticeStore: NoticeStore;

    beforeEach(() => {
        noticeStore = stub<NoticeStore>();
        mainPlayerStore = new MainPlayerStore(noticeStore);
    });

    test("setAuthorizeStore should set the properties on the store with the provided user", () => {
        // Arrange
        const user = {
            UID: 1,
            name: "John",
            avatarId: 123,
            red: 100,
            scoins: 50,
            availSpins: 5,
            currency: "USD",
            offerGames: [{ gameId: 1 }, { gameId: 2 }],
            fractionalOddsFormat: true,
            isDisplayPlayerCurrency: true,
            type: true,
            minBet: 1,
            maxBet: 3000,
            joinedOn: "join",
            currencyCode: "USD",
            currencyGroup: "USD",
            multiplier: 1,
        };

        // Act
        mainPlayerStore.setAuthorizeStore(user);

        // Assert
        expect(mainPlayerStore.UID).toBe(user.UID);
        expect(mainPlayerStore.name).toBe(user.name);
        expect(mainPlayerStore.avatarId).toBe(user.avatarId);
        expect(mainPlayerStore.balance).toBe(user.red);
        expect(mainPlayerStore.scoin).toBe(user.scoins);
        expect(mainPlayerStore.availSpins).toBe(user.availSpins);
        expect(mainPlayerStore.currency).toBe(user.currency);
        expect(mainPlayerStore.offerGames).toStrictEqual(user.offerGames);
        expect(mainPlayerStore.fractionalOddsFormat).toBe(user.fractionalOddsFormat);
        expect(mainPlayerStore.displayPlayerCurrency).toBe(user.isDisplayPlayerCurrency);
    });

    test("setBalance should update the balance, scoin, and availSpins properties on the store", () => {
        // Arrange
        const balance = 100;
        const scoin = 50;
        const availSpins = 5;

        // Act
        mainPlayerStore.setBalance(balance, scoin, availSpins);

        // Assert
        expect(mainPlayerStore.balance).toBe(balance);
        expect(mainPlayerStore.scoin).toBe(scoin);
        expect(mainPlayerStore.availSpins).toBe(availSpins);
    });

    test("setStakeLevel should update the stakeLevel property on the store", () => {
        // Arrange
        const stakeLevel = { minBet: 10, maxBet: 100 };

        // Act
        mainPlayerStore.setStakeLevel(stakeLevel);

        // Assert
        expect(mainPlayerStore.stakeLevel).toStrictEqual(stakeLevel);
    });

    describe("showNoticeChangeStakeLevel", () => {
        afterEach(() => {
            jest.clearAllMocks();
            noticeStore.addWarning = jest.fn();
            Translator.commonTranslate = jest.fn((key, option) => `Mocked ${key}`);
        });

        it("should add a warning when minBet and maxBet are different", () => {
            // Arrange
            const stakeLevel = { minBet: 10, maxBet: 100 };
            const currentStakeLevel = { minBet: 5, maxBet: 50 };

            // Act
            mainPlayerStore.showNoticeChangeStakeLevel(stakeLevel, currentStakeLevel);

            // Assert
            expect(noticeStore.addWarning).toHaveBeenCalled();
        });

        it("should not add a warning when minBet and maxBet are the same", () => {
            // Arrange
            const stakeLevel = { minBet: 10, maxBet: 100 };
            const currentStakeLevel = { minBet: 10, maxBet: 100 };

            // Act
            mainPlayerStore.showNoticeChangeStakeLevel(stakeLevel, currentStakeLevel);

            // Assert
            expect(noticeStore.addWarning).not.toHaveBeenCalled();
        });

        it("should not add a warning when currentStakeLevel is undefined", () => {
            // Arrange
            const stakeLevel = { minBet: 10, maxBet: 100 };
            const currentStakeLevel = { minBet: 0, maxBet: 1000 };

            // Act
            mainPlayerStore.showNoticeChangeStakeLevel(stakeLevel, currentStakeLevel);

            // Assert
            expect(noticeStore.addWarning).not.toHaveBeenCalled();
        });

        it("should not add a warning when minBet or maxBet are zero", () => {
            // Arrange
            const stakeLevel = { minBet: 0, maxBet: 100 };
            const currentStakeLevel = { minBet: 5, maxBet: 0 };

            // Act
            mainPlayerStore.showNoticeChangeStakeLevel(stakeLevel, currentStakeLevel);

            // Assert
            expect(noticeStore.addWarning).not.toHaveBeenCalled();
        });
    });
});
