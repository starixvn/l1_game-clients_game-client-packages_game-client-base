import { SiteConfigs } from "../../src/configs/site-configs";
import { IContainerOptions, buildObserverContainer, getContainer } from "../../src/container";
import { GameSetting } from "../../src/game/game-configs";

export const gameSettings = {
    id: 1,
    name: "SeDie",
    durations: {
        wholeRound: 39,
        lockingBet: 5,
        placingBet: 30,
    },
    numberOfRoundHistory: 100,
};

export const siteConfigs: SiteConfigs = {
    isDev: true,
    systemType: "SG",
    ssl: false,
    serverDomainMapper: {
        localhost: "localhost:5002",
    },
    subDomain: "",
    env: "LOCAL",
    subGuideDomain: "l1-guide",
    enableMsgpackParserAllGames: false,
    enableMsgpackParserOnNotification: false,
    userServiceUrlDev: "http://localhost:3000/user",
    gameGuideUrlDev: "http://guides.unittest.com",
    notificationServiceUrlDev: "https://localhost:3008",
    websocket: {
        proxyPath: "sedie",
        route: "",
    },
};

const containerOptions: IContainerOptions = {
    onContainerCreated: (container) => {
        container.bind(GameSetting).toConstantValue(gameSettings);
        container.bind(SiteConfigs).toConstantValue(siteConfigs);
    },
};

const container = getContainer(containerOptions);
const makeObservable = jest.fn();
container.bind("makeObservable").toFunction(makeObservable);

export default container;

describe(buildObserverContainer.name, () => {
    describe("when called", () => {
        it("should build a container as expected", () => {
            // Arrange
            const container = { get: jest.fn() };

            // Act
            const actual = buildObserverContainer(container as any);

            // Assert
            expect(actual).toStrictEqual({ resolve: expect.any(Function) });
        });
    });
});
