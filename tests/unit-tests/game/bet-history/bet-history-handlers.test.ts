import { stub } from "jest-auto-stub";
import { BetHistoryHandlers, BetHistoryModel, BetHistoryStore } from "../../../../src/game/bet-history";
import { ConnectionStore } from "../../../../src/game/connection";
import { NoticeStore } from "../../../../src/game/notices";
import { MainPlayerStore } from "../../../../src/players";
import { GameClientEmitMessage } from "../../../../src/shared";

describe("BetHistoryPopupHandlers tests", () => {
    describe("handle", () => {
        it("should call to set store data", () => {
            const noticeStore = stub<NoticeStore>();
            const mainPlayerStore = new MainPlayerStore(noticeStore);
            const store = new BetHistoryStore(mainPlayerStore);
            store.setData = jest.fn();
            const data: BetHistoryModel = {
                page: 1,
                pageSize: 8,
                total: 50,
                betLogs: [],
            };

            // arrange
            const handler = new BetHistoryHandlers.BetHistoryPopupHandlers(store);

            // act
            handler.handle(data);

            // assert
            expect(store.setData).toHaveBeenCalledWith(data);
        });
    });
});

describe("BetHistoryCallServiceHandler tests", () => {
    describe("handle", () => {
        it("should call connection store to send page data to server", () => {
            const connectionStore = stub<ConnectionStore>();
            const page = 1;

            // arrange
            const handler = new BetHistoryHandlers.BetHistoryCallServiceHandler(connectionStore);

            // act
            handler.handle(page);

            // assert
            expect(connectionStore.send).toHaveBeenCalledWith(GameClientEmitMessage.BetHistory.eventName, { page: 1 });
        });
    });
});
