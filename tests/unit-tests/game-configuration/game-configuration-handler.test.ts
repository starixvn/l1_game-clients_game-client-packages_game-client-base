import { GameConfigurationHandler } from "../../../src/game-configuration/game-configuration-handler";
import { GameConfigurationStore } from "../../../src/game-configuration/game-configuration-store";
import { SiteConfigs } from "../../../src/configs/site-configs";
import { AppStore } from "../../../src/app/app-store";
import { UrlUtils } from "../../../src/shared/utils/url-utils";
import { when } from "mobx";

// Mock dependencies
jest.mock("../../../src/shared/utils/url-utils");
jest.mock("mobx");

describe("GameConfigurationHandler", () => {
    let handler: GameConfigurationHandler;
    let gameConfigurationStore: jest.Mocked<GameConfigurationStore>;
    let siteConfigs: jest.Mocked<SiteConfigs>;
    let appStore: jest.Mocked<AppStore>;
    let whenEffectCallback: Function;

    const mockGameConfig = { someConfig: "value" };

    beforeEach(() => {
        // Setup mocks
        global.fetch = jest.fn().mockResolvedValue({
            json: jest.fn().mockResolvedValue(mockGameConfig),
        }) as jest.Mock;

        gameConfigurationStore = {
            setGameConfiguration: jest.fn(),
        } as unknown as jest.Mocked<GameConfigurationStore>;

        siteConfigs = {} as jest.Mocked<SiteConfigs>;

        appStore = {
            isStandalone: false,
        } as unknown as jest.Mocked<AppStore>;

        (UrlUtils.buildGameConfiguration as jest.Mock).mockReturnValue("mock-url");
        (when as jest.Mock).mockImplementation((predicate, effect) => {
            // Store the callback in a variable we can access later
            whenEffectCallback = effect;
            // Return a mock disposer function
            return () => {};
        });

        handler = new GameConfigurationHandler(gameConfigurationStore, siteConfigs, appStore);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should register with mobx when to handle configuration when app is standalone", () => {
        expect(when).toHaveBeenCalledTimes(1);
        expect(when).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));

        // Test the predicate function
        const predicate = (when as jest.Mock).mock.calls[0][0];
        expect(predicate()).toBe(false);

        // Change isStandalone to true
        appStore.isStandalone = true;
        expect(predicate()).toBe(true);
    });

    it("should fetch and set game configuration when handled", async () => {
        await handler.handle();

        expect(UrlUtils.buildGameConfiguration).toHaveBeenCalledWith(siteConfigs);
        expect(global.fetch).toHaveBeenCalledWith("mock-url");
        expect(gameConfigurationStore.setGameConfiguration).toHaveBeenCalledWith(mockGameConfig);
    });

    it("should automatically handle when app becomes standalone", async () => {
        // Simulate the when effect being triggered
        const handleSpy = jest.spyOn(handler, "handle");

        // Trigger the effect manually using our stored callback
        whenEffectCallback();

        expect(handleSpy).toHaveBeenCalledTimes(1);
    });
});
