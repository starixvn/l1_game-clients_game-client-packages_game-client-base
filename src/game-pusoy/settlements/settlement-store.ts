import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { PlayerHand, SettlementResult } from "../pusoy-service-messages";

export const ANIMATION_STAGES = {
    crack: "crack",
    natural: "natural",
    normal: "normal",
    mini: "mini",
    fullPusoy: "fullPusoy",
    royalty: "royalty",
    chipFly: "chipFly",
};

export type AnimationStage = keyof typeof ANIMATION_STAGES;

export const ANIMATION_STAGES_KEYS = Object.keys(ANIMATION_STAGES) as AnimationStage[];

@injectable()
export class SettlementStore {
    constructor() {
        makeAutoObservable(this);
    }

    roundId = 0;
    result: Record<string, PlayerHand> = null;
    settlementResult: Record<string, SettlementResult> = null;
    settleEffectDuration: Record<string, number> = null;
    showAnimation: Record<AnimationStage, boolean> = {
        crack: false,
        natural: false,
        normal: false,
        mini: false,
        fullPusoy: false,
        royalty: false,
        chipFly: false,
    };
    settleAnimation: AnimationStage[] = [];

    setSettlementStore(finish: any) {
        finish?.roundId && (this.roundId = finish.roundId);
        finish?.result && (this.result = finish.result);
        finish?.settlementResult && (this.settlementResult = finish.settlementResult);
        finish?.settleEffectDuration && this.setAnimation(finish.settleEffectDuration);
    }

    setAnimation(settleEffectDuration: Record<AnimationStage, number>) {
        this.settleEffectDuration = settleEffectDuration;

        this.settleAnimation = (Object.keys(settleEffectDuration) as AnimationStage[]).filter((key) => settleEffectDuration[key] > 0);

        this.settleAnimation.push(ANIMATION_STAGES.chipFly as AnimationStage);

        this.settleAnimation.sort((a, b) => ANIMATION_STAGES_KEYS.indexOf(a) - ANIMATION_STAGES_KEYS.indexOf(b));

        this.showAnimation[this.settleAnimation[0]] = true;
    }

    updateNextAnimation() {
        if (this.settleAnimation.length > 0) {
            this.showAnimation[this.settleAnimation[0]] = true;
        }
    }

    updateFinishAnimation(animation: AnimationStage) {
        this.showAnimation[animation] = false;

        if (this.settleAnimation.length > 0) {
            this.settleAnimation.shift();
        }
    }
}
