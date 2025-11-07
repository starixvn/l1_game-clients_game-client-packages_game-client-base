import { stub } from "jest-auto-stub";
import { ConnectionStore } from "../../../../src/game/connection";
import { GameUserSettingHandler } from "../../../../src/game/game-user-settings/game-user-setting-handler";
import { HideGameHandler } from "../../../../src/game/hide-game";
import { RoundRunningHandlers } from "../../../../src/game/rounds";

describe("HideGameHandler", () => {
    let roundRunning: RoundRunningHandlers;
    let connectStore: ConnectionStore;
    let handler: HideGameHandler;

    let gameUserSettingHandler: GameUserSettingHandler;

    beforeEach(() => {
        connectStore = stub<ConnectionStore>();

        gameUserSettingHandler = stub<GameUserSettingHandler>();
        roundRunning = stub<RoundRunningHandlers>();
        handler = new HideGameHandler(roundRunning, connectStore, gameUserSettingHandler);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("handle", () => {
        it("should call roundRunning.stopRunner", () => {
            // Arrange

            // Act
            handler.handle();

            // Assert
            expect(roundRunning.stopRunner).toBeCalled();
        });

        it("should call connectStore.disconnect", () => {
            // Arrange

            // Act
            handler.handle();

            // Assert
            expect(connectStore.disconnect).toBeCalled();
        });

        it("should call gameUserSettingHandler.saveTempStorage", async () => {
            // Arrange

            // Act
            handler.handle();

            // Assert
            expect(gameUserSettingHandler.saveTempStorage).toBeCalled();
        });
    });
});
