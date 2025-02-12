import { inject, injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { MainPlayerStore } from "../../players";

export type DynamicObject<T> = {
    [key: string]: T;
};

export type BetHistoryLog = {
    time: string;
    roundId: number;
    win: number;
    betwin: number;
    totalAmount: number;
    freeBet: boolean;
    winLoss?: number;
    odds: DynamicObject<number>;
    result: DynamicObject<object>;
    settlementResult: DynamicObject<boolean>;
    betLogDetails?: Array<DynamicObject<object>>;
    verifiable?: boolean;
};

export type BetHistoryModel = {
    page: number;
    pageSize: number;
    total: number;
    betLogs: Array<BetHistoryLog>;
    fractionalOddsFormat?: boolean;
};

@injectable()
export class BetHistoryStore {
    constructor(@inject(MainPlayerStore) protected readonly mainPlayerStore: MainPlayerStore) {
        makeAutoObservable(this);
    }

    betHistoryModel: BetHistoryModel = null;

    setData(betHistoryModel: BetHistoryModel) {
        betHistoryModel.fractionalOddsFormat = this.mainPlayerStore?.fractionalOddsFormat;
        this.betHistoryModel = betHistoryModel;
    }
}
