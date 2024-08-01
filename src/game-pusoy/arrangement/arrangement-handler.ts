import { injectable, inject } from "inversify";
import { ConnectionStore } from "../../game/connection";
import { Hand, PusoyClientMessages } from "../pusoy-service-messages";
import { RoundStore } from "../rounds";

@injectable()
export class ArrangementHandler {
    constructor(
        @inject(RoundStore) protected readonly roundStore: RoundStore,
        @inject(ConnectionStore) private readonly connectionStore: ConnectionStore
    ) {}

    changeHand(hand: Hand<number[]>) {
        const isChange = isChangeSegment(hand, this.roundStore?.currentHand);
        this.roundStore.currentHand = hand;
        if (isChange) {
            this.connectionStore.send(PusoyClientMessages.changeArrangement, {
                hand: hand,
                playerId: this.roundStore.initPlayerHand?.playerId,
                slot: this.roundStore.initPlayerHand?.slot,
                submit: false,
            });
        }
    }

    submitHand() {
        const { front, middle, back } = this.roundStore.currentHand;
        this.connectionStore.send(PusoyClientMessages.changeArrangement, {
            hand: {
                front: front,
                middle: middle,
                back: back,
            },
            playerId: this.roundStore.initPlayerHand?.playerId,
            slot: this.roundStore.initPlayerHand?.slot,
            submit: true,
        });
    }
}

const isChangeSegment = (hand: Hand<number[]>, currentHand: Hand<number[]>) => {
    const isDifferent = (segment: number[], currentSegment: number[]) => {
        const segmentSet = new Set(segment);
        const different = currentSegment.filter((x) => !segmentSet.has(x));
        return different.length > 0;
    };

    return (
        isDifferent(hand.front, currentHand.front) ||
        isDifferent(hand.middle, currentHand.middle) ||
        isDifferent(hand.back, currentHand.back)
    );
};
