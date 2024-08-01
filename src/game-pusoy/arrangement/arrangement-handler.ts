import { injectable, inject } from "inversify";
import { ConnectionHandlers, ConnectionStore } from "../../game/connection";
import { Hand, PusoyClientMessages } from "../pusoy-service-messages";
import { RoundStore } from "../rounds";
import { MainPlayerStore } from "../../players";

@injectable()
export class ArrangementHandler {
    constructor(
        @inject(RoundStore) protected readonly roundStore: RoundStore,
        @inject(ConnectionStore) private readonly connectionStore: ConnectionStore,
        @inject(MainPlayerStore) private readonly playerStore: MainPlayerStore,
        @inject(ConnectionHandlers.RetryGameHandler) protected readonly retryGameHandler: ConnectionHandlers.RetryGameHandler
    ) {}

    sendArrangementToServer(hand: Hand<number[]>, submit = false) {
        this.connectionStore.send(PusoyClientMessages.changeArrangement, {
            hand: hand,
            playerId: this.roundStore.initPlayerHand?.playerId,
            playerName: this.playerStore.name,
            roundId: this.roundStore.roundId,
            submit,
        });
    }

    changeHand(hand: Hand<number[]>) {
        const isChange = isChangeSegment(hand, this.roundStore?.currentHand);
        this.roundStore.currentHand = hand;
        if (isChange) {
            this.sendArrangementToServer(hand);
        }
    }

    submitHand() {
        this.sendArrangementToServer(this.roundStore.currentHand, true);
    }
}

const isChangeSegment = (hand: Hand<number[]>, currentHand: Hand<number[]>) => {
    const isDifferent = (newSegment: number[], currentSegment: number[]) => {
        if (newSegment.length !== currentSegment.length) {
            return true;
        }
        const segmentSet = new Set(newSegment);

        for (let i = 0; i < newSegment.length; i++) {
            if (!segmentSet.has(currentSegment[i])) {
                return true;
            }
        }

        return false;
    };

    return (
        isDifferent(hand.front, currentHand.front) ||
        isDifferent(hand.middle, currentHand.middle) ||
        isDifferent(hand.back, currentHand.back)
    );
};
