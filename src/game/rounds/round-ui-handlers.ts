import { inject, injectable } from "inversify";
import { reaction, when } from "mobx";
import { IHandler } from "../../shared";
import { ChipStore } from "../chips/chip-store";
import { DisabledGameStore } from "../disabled-game/disabled-game-store";
import { SettlementStatusStore } from "../settlements/settlement-status-store";
import { SettlementStore } from "../settlements/settlement-store";
import { RoundStore } from "./round-store";
import { RoundTimeStore } from "./round-time-store";

export namespace RoundUIHandlers {
    @injectable()
    export class StartingRoundHandler implements IHandler<void> {
        constructor(
            @inject(RoundTimeStore) private readonly roundTimeStore: RoundTimeStore,
            @inject(RoundStore) private readonly roundStore: RoundStore,
            @inject(SettlementStatusStore) private readonly settlementStatusStore: SettlementStatusStore,
            @inject(SettlementStore) private readonly settlementStore: SettlementStore,
            @inject(ChipStore) private readonly chipStore: ChipStore,
            @inject(DisabledGameStore) private readonly disableGameStore: DisabledGameStore
        ) {
            reaction(
                () => this.roundTimeStore.isStartingRound,
                (isStartRound) => isStartRound && this.handle()
            );

            when(
                () => !!this.roundTimeStore?.isStartingRound,
                () => {
                    this.handle();
                }
            );
        }

        handle() {
            this.resetForNewRound();
        }

        resetForNewRound() {
            this.chipStore.resetChips();
            this.roundStore.resetForNewRound();
            this.settlementStatusStore.resetSettlementStatus();
            this.settlementStore.resetSettlementStore();
        }
    }
}
