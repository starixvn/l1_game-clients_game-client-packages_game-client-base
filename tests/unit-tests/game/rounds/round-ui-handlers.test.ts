import { stub } from "jest-auto-stub";
import { reaction, when } from "mobx";
import { ChipStore } from "../../../../src/game/chips/chip-store";
import { DisabledGameStore } from "../../../../src/game/disabled-game/disabled-game-store";
import { RoundStore, RoundTimeStore, RoundUIHandlers } from "../../../../src/game/rounds";
import { SettlementStatusStore, SettlementStore } from "../../../../src/game/settlements";

jest.mock("mobx", () => {
    return {
        reaction: jest.fn(),
        when: jest.fn(),
    };
});
describe("RoundUIHandlers tests", () => {
    describe("StartingRoundHandler", () => {
        let handler: RoundUIHandlers.StartingRoundHandler;
        let roundTimeStore: RoundTimeStore;
        let roundStore: RoundStore;
        let settlementStatusStore: SettlementStatusStore;
        let settlementStore: SettlementStore;
        let chipStore: ChipStore;
        let disabledGameStore: DisabledGameStore;
        beforeAll(() => {
            roundTimeStore = stub<RoundTimeStore>();
            roundStore = stub<RoundStore>();
            settlementStatusStore = stub<SettlementStatusStore>();
            settlementStore = stub<SettlementStore>();
            chipStore = stub<ChipStore>();
            disabledGameStore = stub<DisabledGameStore>();
        });

        beforeEach(() => {
            // Act
            handler = new RoundUIHandlers.StartingRoundHandler(
                roundTimeStore,
                roundStore,
                settlementStatusStore,
                settlementStore,
                chipStore,
                disabledGameStore
            );
        });

        describe("constructor", () => {
            it("should set reaction for this.roundTimeStore.roundState === ROUND_STATE.STARTING_ROUND", () => {
                // Assert
                expect(reaction).toBeCalled();
            });

            it("should set when for this.roundTimeStore.roundState === ROUND_STATE.STARTING_ROUND", () => {
                // Assert
                expect(when).toBeCalled();
            });
        });

        describe("handle", () => {
            it("should call reset some stores", () => {
                roundStore.resetForNewRound = jest.fn();
                settlementStatusStore.resetSettlementStatus = jest.fn();
                settlementStore.resetSettlementStore = jest.fn();
                // Act
                handler.handle();

                // Assert
                expect(roundStore.resetForNewRound).toBeCalled();
                expect(settlementStatusStore.resetSettlementStatus).toBeCalled();
                expect(settlementStore.resetSettlementStore).toBeCalled();
            });
        });
    });
});
