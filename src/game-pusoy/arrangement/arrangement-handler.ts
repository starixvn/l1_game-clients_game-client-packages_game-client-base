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
        if (hand) {
            this.connectionStore.send(PusoyClientMessages.changeArrangement, {
                hand: hand,
                playerId: this.roundStore.initPlayerHand?.playerId,
                playerName: this.playerStore.name,
                roundId: this.roundStore.roundId,
                submit,
            });
        }
    }
}
