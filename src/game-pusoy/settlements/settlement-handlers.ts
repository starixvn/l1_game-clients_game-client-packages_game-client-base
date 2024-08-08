import { inject, injectable } from "inversify";
import { GameServiceMessage, IMultipleHandlers } from "../../shared";
import { AnimationStage, SettlementStore } from "./settlement-store";

@injectable()
export class SettlementHandlers implements IMultipleHandlers {
    constructor(@inject(SettlementStore) protected readonly settlementStore: SettlementStore) {}

    handleFinish(finish: GameServiceMessage.Finish | undefined) {
        this.settlementStore.setSettlementStore(finish);
    }

    handleFinishAnimation(animation: AnimationStage) {
        this.settlementStore.updateFinishAnimation(animation);
        this.settlementStore.updateNextAnimation();
    }

    eventHandleList = [
        {
            name: GameServiceMessage.Finish.eventName,
            handle: this.handleFinish,
        },
    ];
}
