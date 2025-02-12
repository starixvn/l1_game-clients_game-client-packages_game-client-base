import { stub } from "jest-auto-stub";
import { BetHistoryModel, BetHistoryStore } from "../../../../src/game/bet-history";
import { NoticeStore } from "../../../../src/game/notices";
import { MainPlayerStore } from "../../../../src/players";

describe("BetHistoryStore tests", () => {
    let store: BetHistoryStore;

    beforeAll(() => {
        // arrange
        const noticeStore = stub<NoticeStore>();
        const mainPlayerStore = new MainPlayerStore(noticeStore);
        store = new BetHistoryStore(mainPlayerStore);
    });

    describe("setData", () => {
        it("should set disabled value correctly", () => {
            const data: BetHistoryModel = {
                page: 1,
                pageSize: 8,
                total: 50,
                betLogs: [],
            };

            // act
            store.setData(data);

            // assert
            expect(store.betHistoryModel).toEqual(data);
        });
    });
});
