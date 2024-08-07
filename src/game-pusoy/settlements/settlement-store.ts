import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { PlayerHand, SettlementResult } from "../pusoy-service-messages";

export enum AnimationOrder {
    crack,
    natural,
    normal,
    mini,
    fullPusoy,
    royalty,
    chipFly,
}

@injectable()
export class SettlementStore {
    constructor() {
        makeAutoObservable(this);
    }

    roundId = 0;
    result: Record<string, PlayerHand> = null;
    settlementResult: Record<string, SettlementResult> = null;
    settleEffectDuration: Record<string, number> = null;
    showAnimation: Record<AnimationOrder, boolean> = {
        [AnimationOrder.crack]: false,
        [AnimationOrder.natural]: false,
        [AnimationOrder.normal]: false,
        [AnimationOrder.mini]: false,
        [AnimationOrder.fullPusoy]: false,
        [AnimationOrder.royalty]: false,
        [AnimationOrder.chipFly]: false,
    };
    settleAnimation: AnimationOrder[] = [];

    setSettlementStore(finish: any) {
        finish?.roundId && (this.roundId = finish.roundId);
        finish?.result && (this.result = finish.result);
        finish?.settlementResult && (this.settlementResult = finish.settlementResult);
        finish?.settleEffectDuration && this.setAnimation(finish.settleEffectDuration);
    }

    setAnimation(settleEffectDuration: Record<string, number>) {
        this.settleEffectDuration = settleEffectDuration;

        this.settleAnimation = Object.keys(settleEffectDuration)
            .filter((key) => settleEffectDuration[key] > 0)
            .map((key) => AnimationOrder[key]);

        this.settleAnimation.push(AnimationOrder.chipFly);

        this.settleAnimation.sort((a, b) => a - b);

        this.showAnimation[this.settleAnimation[0]] = true;
    }

    updateNextAnimation() {
        if (this.settleAnimation.length > 0) {
            this.showAnimation[this.settleAnimation[0]] = true;
        }
    }

    updateFinishAnimation(animation: AnimationOrder) {
        this.showAnimation[animation] = false;

        if (this.settleAnimation.length > 0) {
            this.settleAnimation.shift();
        }
    }
}
