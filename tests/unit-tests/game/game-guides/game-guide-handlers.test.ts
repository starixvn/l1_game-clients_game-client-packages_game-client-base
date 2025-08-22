import { stub } from "jest-auto-stub";

import { AuthStore } from "../../../../src/auth/auth-store";
import { SiteConfigs } from "../../../../src/configs";
import { GameConfigStore, GameSetting } from "../../../../src/game/game-configs";
import { GameGuideHandlers } from "../../../../src/game/game-guides/game-guide-handlers";
import { GameGuideStore } from "../../../../src/game/game-guides/game-guide-store";
import { RoundStore } from "../../../../src/game/rounds/round-store";
import { MainPlayerStore } from "../../../../src/players/main-player-store";
import { AppTypes } from "../../../../src/shared/constants/app-type";
import { StorageManager } from "../../../../src/shared/utils";

jest.mock("../../../../src/shared/utils", () => ({
    StorageManager: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
    },
    localStorageKeys: {
        playerIngameSelections: "player-selections",
    },
    UrlUtils: { buildGameGuideUrl: jest.fn().mockReturnValue("guide.test") },
    Translator: {
        gameTranslate: jest.fn().mockReturnValue("Test"),
    },
}));

const now = new Date(123456);
jest.useFakeTimers().setSystemTime(now);

describe("GameGuideHandlers test", () => {
    describe("GetGuideURL", () => {
        let handler: GameGuideHandlers.GetGuideURL;
        let authStore: AuthStore;
        let guideStore: GameGuideStore;
        beforeEach(() => {
            const siteConfigs = stub<SiteConfigs>();
            const gameSetting = stub<GameSetting>();
            gameSetting.id = 1;
            authStore = stub<AuthStore>();
            const playerStore = stub<MainPlayerStore>();
            playerStore.fractionalOddsFormat = false;
            const gameConfigsStore = stub<GameConfigStore>();
            gameConfigsStore.boostedChoices = [];
            const roundStore = stub<RoundStore>({
                minBet: 1,
                maxBet: 2000,
            });
            guideStore = stub<GameGuideStore>();
            handler = new GameGuideHandlers.GetGuideURL(
                siteConfigs,
                gameSetting,
                authStore,
                playerStore,
                roundStore,
                gameConfigsStore,
                guideStore
            );
        });

        test.each([
            {
                system: AppTypes.Club,
                language: "vi-VN",
                specialDirection: "",
                expected: "guide.test/vi?gId=1&t=blue&f=sc&p=false&v=123456&fof=false&minBet=1&maxBet=2000&scrollToId=md5&displayName=Test",
            },
            {
                system: AppTypes.Mobi,
                language: "en-US",
                specialDirection: "",
                expected: "guide.test/en?gId=1&t=blue&f=sm&p=false&v=123456&fof=false&minBet=1&maxBet=2000&scrollToId=md5&displayName=Test",
            },
            {
                system: AppTypes.Mobi,
                language: "en-UK",
                specialDirection: "",
                expected: "guide.test/en?gId=1&t=blue&f=sm&p=false&v=123456&fof=false&minBet=1&maxBet=2000&scrollToId=md5&displayName=Test",
            },
            {
                system: AppTypes.Instant,
                language: "th-TH",
                specialDirection: "",
                expected: "guide.test/th?gId=1&t=blue&f=si&p=false&v=123456&fof=false&minBet=1&maxBet=2000&scrollToId=md5&displayName=Test",
            },
            {
                system: AppTypes.MegaKeno,
                language: "id-ID",
                specialDirection: "",
                expected: "guide.test/id?gId=1&t=blue&f=sm&p=false&v=123456&fof=false&minBet=1&maxBet=2000&scrollToId=md5&displayName=Test",
            },
            {
                system: AppTypes.App,
                language: "zh-CN",
                specialDirection: "",
                expected:
                    "guide.test/zh_cn?gId=1&t=blue&f=sc&p=false&v=123456&fof=false&minBet=1&maxBet=2000&scrollToId=md5&displayName=Test",
            },
            {
                system: AppTypes.Club,
                language: "zh-TW",
                specialDirection: "",
                expected:
                    "guide.test/zh_tw?gId=1&t=blue&f=sc&p=false&v=123456&fof=false&minBet=1&maxBet=2000&scrollToId=md5&displayName=Test",
            },
        ])(
            "should get expected url when system=$system , language=$language and specialDirection=$specialDirection",
            ({ system, language, specialDirection, expected }) => {
                // arrange
                authStore.system = system;

                const languageId = language.includes("zh") ? language.toLocaleLowerCase().replace("-", "_") : language.slice(0, 2);

                // @ts-ignore
                handler.getLanguage = jest.fn().mockReturnValue(languageId);
                (StorageManager.get as jest.Mock).mockReturnValueOnce({ session: "session", ssoTime: new Date("2023-01-01"), language });

                // act
                handler.handle({ theme: "blue", specialDirection, scrollToId: "md5" });

                // assert
                expect(guideStore.url).toEqual(expected);
            }
        );
    });
});
