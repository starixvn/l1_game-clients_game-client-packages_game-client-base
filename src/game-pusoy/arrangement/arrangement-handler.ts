import { injectable, inject } from "inversify";
import { RoundStore } from "../rounds";
import { ConnectionStore } from "../../game/connection";
import { Hand, PusoyClientMessages } from "../pusoy-service-messages";

@injectable()
export class ArrangementHandler {
    constructor(
        @inject(RoundStore) protected readonly store: RoundStore,
        @inject(ConnectionStore) private readonly connectionStore: ConnectionStore
    ) {}

    changeHand(hand: Hand<number[]>, submit = false) {
        this.store.playerHand.hand = hand;

        this.connectionStore.send(PusoyClientMessages.changeArrangement, {
            hand: hand,
            playerId: this.store.playerHand.playerId,
            slot: this.store.playerHand.slot,
            submit: submit,
        });
    }
}
