import { stub } from "jest-auto-stub";
import { JoinGameHandler, JoinGameStore } from "../../../../src/game/join-game";
import { AppStore } from "../../../../src/app/app-store";

describe("JoinGameHandler", () => {
    let handler: JoinGameHandler;
    let joinGameStore: JoinGameStore;
    let appStore: AppStore;

    beforeEach(() => {
        joinGameStore = stub<JoinGameStore>();
        appStore = stub<AppStore>();

        handler = new JoinGameHandler(joinGameStore, appStore);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("handle", () => {
        it("should stop the round runner, round time store and disconnect store", () => {
            // Arrange
            const toGame = "SeDie";

            // Act
            handler.handle(toGame);

            // Assert
            expect(joinGameStore.toGame).toEqual({ name: toGame });
        });
    });
});
