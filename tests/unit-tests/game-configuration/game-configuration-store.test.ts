import { GameConfigurationStore } from "../../../src/game-configuration/game-configuration-store";

describe("GameConfigurationStore", () => {
    let store: GameConfigurationStore;

    beforeEach(() => {
        store = new GameConfigurationStore();
    });

    it("should initialize with empty game configuration array", () => {
        expect(store.gameConfiguration).toEqual([]);
    });

    it("should set game configuration correctly", () => {
        const mockConfigurations = [
            {
                id: 1,
                name: "Test Game 1",
                key: "test-game-1",
                mini: {
                    miniPanel: true,
                },
            },
            {
                id: 2,
                name: "Test Game 2",
                key: "test-game-2",
                isMicrosite: true,
                hasInstant: false,
            },
        ];

        store.setGameConfiguration(mockConfigurations);

        expect(store.gameConfiguration).toEqual(mockConfigurations);
        expect(store.gameConfiguration.length).toBe(2);
        expect(store.gameConfiguration[0].name).toBe("Test Game 1");
        expect(store.gameConfiguration[1].key).toBe("test-game-2");
    });
});
