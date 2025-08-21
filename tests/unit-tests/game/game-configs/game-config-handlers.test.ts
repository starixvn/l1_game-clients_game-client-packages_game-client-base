import { AppStore } from "../../../../src/app/app-store";
import { DisabledGameStore } from "../../../../src/game/disabled-game/disabled-game-store";
import { GameConfigHandlers, GameConfigStore } from "../../../../src/game/game-configs";
import { NoticeStore } from "../../../../src/game/notices/notice-store";
import { GameServiceMessage } from "../../../../src/shared";

describe("GameConfigHandlers test", () => {
    describe("handleGameConfigs", () => {
        let configStore: GameConfigStore;
        let appStore: AppStore;
        let noticeStore: NoticeStore;
        let disabledGameStore: DisabledGameStore;
        let handler: GameConfigHandlers;
        const gameConfig = new GameServiceMessage.GameConfigs();
        beforeEach(() => {
            configStore = new GameConfigStore();
            appStore = new AppStore();
            noticeStore = new NoticeStore();
            disabledGameStore = new DisabledGameStore();

            configStore.setGameConfigs = jest.fn();
            noticeStore.hideNotice = jest.fn();
            disabledGameStore.setShowPopup = jest.fn();
            handler = new GameConfigHandlers(configStore, appStore, noticeStore, disabledGameStore);
        });
        it("should call setGameConfigs in GameConfigStore", () => {
            // act
            handler.handleGameConfigs(gameConfig);

            // assert
            expect(configStore.setGameConfigs).toHaveBeenCalledWith(gameConfig);
            expect(noticeStore.hideNotice).toHaveBeenCalled();
        });

        it("should set appStore isLoading = false", () => {
            // arrange
            appStore.isLoading = true;

            // act
            handler.handleGameConfigs(gameConfig);

            // assert
            expect(appStore.isLoading).toBe(false);
        });
    });
    describe("eventHandleList", () => {
        it("should be equal expected", () => {
            // arrange
            const configStore = new GameConfigStore();
            const appStore = new AppStore();
            const noticeStore = new NoticeStore();
            const disabledGameStore = new DisabledGameStore();
            const handler = new GameConfigHandlers(configStore, appStore, noticeStore, disabledGameStore);
            const expected = [
                {
                    name: GameServiceMessage.GameConfigs.eventName,
                    handle: handler.handleGameConfigs,
                },
            ];

            // assert
            expect(handler.eventHandleList).toEqual(expected);
        });
    });
});
