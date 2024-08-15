import { inject, injectable } from "inversify";
import { MainPlayerStore } from "../../players";
import { IMultipleHandlers } from "../../shared";
import { ArrangementStore } from "../arrangement";
import { PusoyServiceMessages } from "../pusoy-service-messages";
import { RoundStore } from "./round-store";

@injectable()
export class RoundHandlers implements IMultipleHandlers {
    constructor(
        @inject(RoundStore) protected readonly roundStore: RoundStore,
        @inject(MainPlayerStore) private readonly playerStore: MainPlayerStore,
        @inject(ArrangementStore) private readonly arrangementStore: ArrangementStore
    ) {}

    handleRoundData(data: PusoyServiceMessages.RoundData) {
        this.roundStore.roundId = data?.roundId;
        this.roundStore.initPlayerHand = data?.playerHand;
        this.roundStore.submittedPlayers = data?.submittedPlayers || [];
        this.roundStore.otherPlayers = data?.otherPlayers || [];
        this.arrangementStore.mainPlayerSubmitted =
            this.roundStore.submittedPlayers.filter((p) => p.name === this.playerStore.name).length > 0;
    }

    handleSubmittedPlayer(player: PusoyServiceMessages.SubmittedPlayer) {
        this.roundStore.submittedPlayers = [...this.roundStore.submittedPlayers, player];
        if (player.name === this.playerStore.name) {
            this.arrangementStore.mainPlayerSubmitted = true;
        }
    }

    handleRearrangePlayer(player: PusoyServiceMessages.RearrangePlayer) {
        if (player.canRearrange) {
            this.roundStore.submittedPlayers = this.roundStore.submittedPlayers.filter((p) => p.id !== player.playerId);
            if (player.playerName === this.playerStore.name) {
                this.arrangementStore.mainPlayerSubmitted = false;
            }
        }
    }

    eventHandleList = [
        {
            name: PusoyServiceMessages.RoundData.eventName,
            handle: this.handleRoundData,
        },
        {
            name: PusoyServiceMessages.SubmittedPlayer.eventName,
            handle: this.handleSubmittedPlayer,
        },
        {
            name: PusoyServiceMessages.RearrangePlayer.eventName,
            handle: this.handleRearrangePlayer,
        },
    ];
}
