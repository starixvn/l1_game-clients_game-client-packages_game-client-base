import { inject, injectable } from "inversify";
import { HandsStore } from "../hands";
import { ConnectionHandlers, ConnectionStore } from "../../game/connection";
import { BetStore } from "../../game/bets/bet-store";
import { NoticeStore } from "../../game/notices";
import { Translator } from "../../shared/utils";
import { MainPlayerStore } from "../../players";
import { RoundStore } from "../rounds";
import { GameClientEmitMessage } from "../../shared";
import { IHandler } from "../../shared";

@injectable()
export class ActionHandlerBase implements IHandler<void> {
    constructor(
        @inject(MainPlayerStore) protected readonly mainPlayerStore: MainPlayerStore,
        @inject(BetStore) protected readonly betStore: BetStore,
        @inject(HandsStore) protected readonly handsStore: HandsStore,
        @inject(RoundStore) protected readonly roundStore: RoundStore,
        @inject(ConnectionStore) protected readonly connectionStore: ConnectionStore,
        @inject(ConnectionHandlers.RetryGameHandler) protected readonly retryGameHandler: ConnectionHandlers.RetryGameHandler,
        @inject(NoticeStore) protected readonly noticeStore: NoticeStore
    ) {}

    protected action = "";

    handle() {
        if (this.isValidBet()) {
            this.updateState();
            const data = this.createBetData();
            this.connectionStore.send(GameClientEmitMessage.Bet.eventName, data);
            this.retryGameHandler.handle();
            this.roundStore.action = this.action;
        }
    }

    updateState() {
        this.betStore.isProcessingBet = true;
        this.roundStore.isRunning = true;
    }

    createBetData(): any {
        return {
            username: this.mainPlayerStore.name,
            freeBet: this.betStore.freebetEnabled,
            clientSentTime: new Date(),
        };
    }

    isValidBet() {
        if (this.betStore.isProcessingBet) {
            this.showWarningProcessingBet();
            return false;
        }
        return true;
    }

    showWarningProcessingBet() {
        this.noticeStore.addProcessWarning(Translator.commonTranslate("message_processing_action"));
    }
}
