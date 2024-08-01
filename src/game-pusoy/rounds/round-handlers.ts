import { injectable, inject } from "inversify";
import { RoundStore } from "./round-store";
import { PusoyServiceMessages } from "../pusoy-service-messages";
import { IMultipleHandlers } from "../../shared";
import { makeObservable, observable } from "mobx";

@injectable()
export class RoundHandlers implements IMultipleHandlers {
    constructor(@inject(RoundStore) protected readonly store: RoundStore) {}

    handleRoundData(data: PusoyServiceMessages.RoundData) {
        this.store.roundId = data?.roundId;
        this.store.initPlayerHand = data?.playerHand;
        this.store.currentHand = data?.playerHand?.hand || {
            front: [],
            middle: [],
            back: [],
        };
    }

    eventHandleList = [
        {
            name: PusoyServiceMessages.RoundData.eventname,
            handle: this.handleRoundData,
        },
    ];
}
