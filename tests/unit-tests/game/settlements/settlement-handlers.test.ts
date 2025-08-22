import { stub } from "jest-auto-stub";
import { NoticeStore } from "../../../../src/game/notices/notice-store";
import { SettlementHandlers, SettlementStatusStore, SettlementStore } from "../../../../src/game/settlements";
import { GameServiceMessage } from "../../../../src/shared";

describe("SettlementHandlers tests", () => {
    let settlementStore: SettlementStore;
    let statusStore: SettlementStatusStore;
    let settlementHandlers: SettlementHandlers;
    let noticeStore: NoticeStore;

    beforeEach(() => {
        settlementStore = stub<SettlementStore>();
        statusStore = new SettlementStatusStore();
        noticeStore = stub<NoticeStore>();
        settlementHandlers = new SettlementHandlers(settlementStore, statusStore, noticeStore);
    });

    describe("handleFinish", () => {
        it("should call setSettlementStore in settlementStore", () => {
            // arrange
            settlementStore.setSettlementStore = jest.fn();
            const finish = new GameServiceMessage.Finish();

            // act
            settlementHandlers.handleFinish(finish);

            // assert
            expect(settlementStore.setSettlementStore).toHaveBeenCalledWith(finish);
        });
    });

    describe("handleStatus", () => {
        it("should call setStatusStore in SettlementStatusStore", () => {
            // arrange
            statusStore.setStatusStore = jest.fn();
            const status = new GameServiceMessage.Status();

            // act
            settlementHandlers.handleStatus(status);

            // assert
            expect(statusStore.setStatusStore).toHaveBeenCalledWith(status);
        });
    });

    describe("handleWinners", () => {
        it("should call handleWinners in SettlementStatusStore", () => {
            // arrange
            const winner: GameServiceMessage.Winners = {
                roundId: 1,
                winningPlayers: {
                    1: {
                        bet: 1,
                        rate: 1,
                        win: true,
                        winningByChoices: { choice: 1 },
                    },
                },
            };

            // act
            settlementHandlers.handleWinners(winner);

            // assert
            expect(settlementStore.winningPlayers).toEqual(winner.winningPlayers);
        });
    });

    describe("eventHandleList", () => {
        it("should be equal expected", () => {
            // arrange
            const expected = [
                {
                    name: GameServiceMessage.Finish.eventName,
                    handle: settlementHandlers.handleFinish,
                },
                {
                    name: GameServiceMessage.Status.eventName,
                    handle: settlementHandlers.handleStatus,
                },
                {
                    name: GameServiceMessage.Winners.eventName,
                    handle: settlementHandlers.handleWinners,
                },
            ];

            // assert
            expect(settlementHandlers.eventHandleList).toEqual(expected);
        });
    });
});
