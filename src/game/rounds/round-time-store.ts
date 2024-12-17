import { inject, injectable } from "inversify";
import { makeAutoObservable } from "mobx";

import { GameSetting } from "../game-configs";

/**
 * Timeline:
 *
 *   Settle                                                                                                 Settle
 *   |                                                                                                        |
 *   V                                                                                                        V
 *   |-------------------------|---------------|-------------------|---------------|---------------|-----------|-------------------------|
 *   |  SHOW_ANIMATION_RESULT  |  SHOW_RESULT  |   STARTING_ROUND  |  PLACING_BET  |  LOCKING_BET  |  WAITING  |  SHOW_ANIMATION_RESULT  |
 *   |-------------------------|---------------|-------------------|---------------|---------------|-----------|-------------------------|
 *   | in 2s(generatingResult) |               | in 1s(startRound) |               |               |           |
 *   39 Whole round            37              31                  30              5               0       0...|... 39 Whole round
 */

export const ROUND_STATE = {
    START_GAME_LOOP: "startGameLoop",
    STARTING_ROUND: "startingRound",
    PLACING_BET: "placingBet",
    LOCKING_BET: "lockingBet",
    WAITING: "waiting",
    SHOW_ANIMATION_RESULT: "showAnimationResult",
    SHOW_RESULT: "showResult",
    CHANGE_REMAINING_TIME: "changeRemainingTime",
    STOP_GAME_LOOP: "stopGameLoop",
    NONE: "none",
};

const RoundTimeInitValue = -99999;

@injectable()
export class RoundTimeStore {
    private _roundTime = RoundTimeInitValue;
    private _roundState = ROUND_STATE.NONE;
    private _countdownTimer = 0;
    private _remaining = 0;
    startNewRound = false;
    endRound = false;
    startPlacingBet = false;
    endPlacingBet = false;
    durationShowPromptMessage = 2;

    constructor(@inject(GameSetting) readonly gameSetting: GameSetting) {
        makeAutoObservable(this);
        this.setDurationShowPromptMessage(gameSetting?.durationShowPromptMessage);
    }

    get wholeRound() {
        return this.gameSetting.durations.wholeRound;
    }
    get placingBet() {
        return this.gameSetting.durations.placingBet;
    }
    get lockingBet() {
        return this.gameSetting.durations.lockingBet;
    }
    get generatingResult() {
        return this.gameSetting.durations.generatingResult;
    }
    get showingResult() {
        return this.gameSetting.durations.showingResult;
    }
    get startRound() {
        return this.gameSetting.durations.startRound;
    }
    get wholeShoe() {
        return this.gameSetting.durations.wholeShoe;
    }

    get initialized() {
        return this.roundTime !== RoundTimeInitValue;
    }

    get isWaiting() {
        return this.roundTime > this.placingBet;
    }

    get isStartWaiting() {
        return this.roundTime === this.wholeRound;
    }

    get isLocking() {
        return this.roundTime <= this.lockingBet && this.roundTime > 0;
    }

    get isStartLocking() {
        return this.roundTime === this.lockingBet;
    }

    get isPlacingBet() {
        return this.roundTime <= this.placingBet && this.roundTime > this.lockingBet;
    }

    get isStartPlacingBet() {
        return this.roundTime === this.placingBet;
    }

    get isShowAnimationResult() {
        if (this.roundTime > this.wholeRound) {
            return this.roundTime <= this.wholeShoe && this.roundTime > this.wholeShoe - this.generatingResult;
        }

        return (this.roundTime <= this.wholeRound && this.roundTime > this.wholeRound - this.generatingResult) || this.roundTime === 0;
    }

    get isShowResult() {
        if (this.roundTime > this.wholeRound) {
            return (
                this.roundTime <= this.wholeShoe - this.generatingResult &&
                this.roundTime >= this.wholeShoe - this.generatingResult - this.showingResult
            );
        }

        return (
            this.roundTime <= this.wholeRound - this.generatingResult + 1 &&
            this.roundTime > this.placingBet + this.startRound &&
            this.wholeRound !== 0
        );
    }

    get isStartRound() {
        return this.roundTime === this.placingBet + this.startRound;
    }

    get isStartingRound() {
        return this.roundTime <= this.placingBet + this.startRound && this.roundTime > this.placingBet;
    }

    get isTimeOut() {
        return this.roundTime === 0;
    }

    get isInRoundTime() {
        return this.roundState === ROUND_STATE.PLACING_BET || this.roundState === ROUND_STATE.LOCKING_BET;
    }

    get isShowDisabledGameMessage() {
        return this._roundTime <= this.placingBet || this._roundTime === this.wholeRound;
    }

    get isDisplayingResultState() {
        return (
            this.roundState === ROUND_STATE.SHOW_ANIMATION_RESULT ||
            this.roundState === ROUND_STATE.SHOW_RESULT ||
            this.roundState === ROUND_STATE.STOP_GAME_LOOP
        );
    }

    get isVisibleReBet() {
        return this.isStartingRound || this.isLocking || this.isWaiting;
    }

    get isShowStartBetMessage() {
        return this.roundTime <= this.placingBet + this.durationShowPromptMessage && this.roundTime > this.placingBet;
    }

    resetRoundTime() {
        this._roundTime = this.wholeRound;
    }

    setDurationShowPromptMessage(durationShowPromptMessage?: number) {
        durationShowPromptMessage && (this.durationShowPromptMessage = durationShowPromptMessage);
    }

    countdown() {
        if (this.roundTime <= 1) {
            this.roundTime = 0;
        } else {
            this.roundTime--;
        }
    }

    get roundTime() {
        return this._roundTime;
    }

    set roundTime(roundTime) {
        this._roundTime = roundTime;
        this.calculateRoundStatus();
    }

    get remaining() {
        return this._remaining;
    }

    get roundState() {
        return this._roundState;
    }

    set roundState(value: string) {
        this._roundState = value;
    }

    get countdownTimer() {
        return this._countdownTimer;
    }

    calculateRoundStatus() {
        this.roundState = this.getCurrentRoundState();
        if (this.roundTime < 0) {
            return;
        }

        if (this.isWaiting) {
            this._remaining = this.roundTime - this.placingBet;
        }

        if (this.isShowAnimationResult) {
            this._remaining = this.generatingResult;
        }

        if (this.isShowResult) {
            let duration = 0;

            if (this.roundTime > this.wholeRound) {
                const minTime = this.wholeShoe - this.generatingResult - this.showingResult;
                duration = this.roundTime - minTime;
            } else {
                duration = this.roundTime - this.placingBet - this.startRound;
            }

            this._remaining = duration;
            this._countdownTimer = duration;
        }

        if (this.isStartingRound) {
            this._remaining = this.startRound;
        }

        if (this.isPlacingBet) {
            this._remaining = this.roundTime - this.lockingBet;
            this._countdownTimer = this.roundTime;
        }

        if (this.isLocking) {
            this._remaining = this.roundTime;
            this._countdownTimer = this.roundTime;
        }
    }

    getCurrentRoundState(): string {
        if (this.roundTime < 0) {
            return ROUND_STATE.WAITING;
        }

        let currentState = "";
        if (this.isWaiting) {
            currentState = ROUND_STATE.WAITING;
        }

        if (this.isShowAnimationResult) {
            currentState = ROUND_STATE.SHOW_ANIMATION_RESULT;
        }

        if (this.isShowResult) {
            currentState = ROUND_STATE.SHOW_RESULT;
        }

        if (this.isStartingRound) {
            currentState = ROUND_STATE.STARTING_ROUND;
        }

        if (this.isPlacingBet) {
            currentState = ROUND_STATE.PLACING_BET;
        }

        if (this.isLocking) {
            currentState = ROUND_STATE.LOCKING_BET;
        }
        return currentState;
    }

    start() {
        this.roundState = ROUND_STATE.START_GAME_LOOP;
    }

    resetRoundTimeStore() {
        this.roundState = ROUND_STATE.STOP_GAME_LOOP;
    }
}
