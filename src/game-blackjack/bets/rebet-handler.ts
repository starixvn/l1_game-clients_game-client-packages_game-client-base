import { inject, injectable } from "inversify";
import { HandHandlers, HandsStore } from "../hands";
import { DealHandler } from "./deal-handler";
import { IHandler } from "../../shared";

@injectable()
export class RebetHandler implements IHandler<number | undefined> {
    constructor(
        @inject(HandsStore) protected readonly handsStore: HandsStore,
        @inject(HandHandlers) protected readonly handHandlers: HandHandlers,
        @inject(DealHandler) protected readonly dealHandler: DealHandler
    ) {}

    handle(handsAmount = 1) {
        const previousHandBets = this.getPreviousHandBets(handsAmount);
        if (previousHandBets.length === 0) {
            return;
        }
        const allHandsPlaced = previousHandBets.every((hand) => {
            return this.handHandlers.placeChip(hand.pos, hand.bet);
        });

        if (allHandsPlaced) {
            this.dealHandler.handle();
        }
    }

    getPreviousHandBets(handsAmount: number) {
        return this.handsStore.previousHandBets.filter((hand) => hand.pos <= handsAmount);
    }
}
