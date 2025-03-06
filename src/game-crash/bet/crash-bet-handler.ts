import { inject, injectable } from "inversify";
import { BetHandlerBase } from "../../game/bets/bet-handler-base";
import { BetStore } from "../../game/bets/bet-store";
import { ConnectionHandlers, ConnectionStore } from "../../game/connection";
import { GameSetting } from "../../game/game-configs/game-setting";
import { NoticeStore } from "../../game/notices";
import { OrientationStore } from "../../game/orientation";
import { RoundStore, RoundTimeStore } from "../../game/rounds";
import { MainPlayerStore } from "../../players";
import { AutoCashOutStore } from "../auto-cash-out";
import { BetInputStore } from "../bet-input";
import { ProvablyFairStore } from "../provably-fair";

@injectable()
export class CrashBetHandler extends BetHandlerBase {
    constructor(
        @inject(ConnectionStore) protected readonly connectionStore: ConnectionStore,
        @inject(BetStore) protected readonly betStore: BetStore,
        @inject(MainPlayerStore) protected readonly mainPlayerStore: MainPlayerStore,
        @inject(OrientationStore) protected readonly orientationStore: OrientationStore,
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore,
        @inject(NoticeStore) protected readonly noticeStore: NoticeStore,
        @inject(ConnectionHandlers.RetryGameHandler) protected readonly retryGameHandler: ConnectionHandlers.RetryGameHandler,
        @inject(GameSetting) protected readonly gameSetting: GameSetting,
        @inject(RoundStore) protected readonly roundStore: RoundStore,
        @inject(AutoCashOutStore) protected readonly autoCashOutStore: AutoCashOutStore,
        @inject(BetInputStore) protected readonly betInputStore: BetInputStore,
        @inject(ProvablyFairStore) protected readonly pfStore: ProvablyFairStore
    ) {
        super(connectionStore, betStore, mainPlayerStore, orientationStore, roundTimeStore, noticeStore, retryGameHandler, gameSetting);
    }

    handle() {
        const betData = this.createBetData({});
        this.handleBetData(betData);
    }

    override getBetAmount(): number {
        return this.betInputStore.betAmount;
    }

    override createBetData(data: any) {
        const betData = super.createBetData(data);
        return Object.assign(betData, {
            autoCashOut: this.autoCashOutStore.enable ? this.autoCashOutStore.multiplier : undefined,
            roundId: this.roundStore.clientRoundId,
            clientSeed: this.pfStore.clientSeed,
            clientSendTime: new Date(),
        });
    }

    autoPlaceBet() {
        this.handle();
    }
}
