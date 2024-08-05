import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { PlayerHand, SettlementResult } from "../pusoy-service-messages";

@injectable()
export class SettlementStore {
    constructor() {
        makeAutoObservable(this);
    }

    roundId = 0;
    result: Record<string, PlayerHand> = null;
    settlementResult: SettlementResult = null;

    setSettlementStore(finish: any) {
        finish?.roundId && (this.roundId = finish.roundId);
        finish?.result && (this.result = finish.result);
        finish?.settlementResult && (this.settlementResult = finish.settlementResult);
    }
}
