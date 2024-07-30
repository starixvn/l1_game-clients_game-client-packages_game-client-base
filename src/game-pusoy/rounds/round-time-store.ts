import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";

export type RoundTimeSetting = {
    transition: number;
    deal: number;
    arrangement: number;
    animation: number;
};

export const TimelineKey = {
    transition: "transition",
    deal: "deal",
    arrangement: "arrangement",
    animation: "animation",
};

/**
 * Timeline:
 *
 *                Place bet                              Settle
 *                    |                                    |
 *                    V                                    V
 * +------------------+---------+------------+-------------+---------+-----------------------+------------------+
 * | ROUND_TRANSITION | WAITING | DEAL_CARDS | ARRANGEMENT | WAITING | SHOW_ANIMATION_RESULT | ROUND_TRANSITION |
 * +------------------+---------+------------+-------------+---------+-----------------------+------------------+
 * |                  |         |            |             |         |                       |                  |
 * +------------------+---------+------------+-------------+---------+-----------------------+------------------+
 * 54                 51   51...|            50            0     0...| <New remaining>       54
 */
@injectable()
export class RoundTimeStore {
    public timeline: Record<string, number> = {};

    private _remaining = 0;

    private paused = false;

    runner: NodeJS.Timer;

    constructor() {
        makeAutoObservable(this, { runner: false, timeline: false });
    }

    configure(timeline: Record<string, number> = { transition: 54, deal: 51, arrangement: 50 }) {
        this.timeline = timeline;
    }

    countdown() {
        if (!this.paused) {
            this.remaining--;

            this.paused = this.remaining <= 0;
        }
    }

    play() {
        this.paused = false;
    }

    pause() {
        this.paused = true;
    }

    start() {
        this.runner = setInterval(() => {
            this.countdown();
        }, 1000);
    }

    stop() {
        clearInterval(this.runner);

        this.runner = undefined;
    }

    at(key: string): boolean {
        const time = this.timeline[key];

        if (!time) {
            return false;
        }

        return this.remaining === time;
    }

    in(key: string): boolean {
        const current = this.timeline[key];

        if (!current) {
            return false;
        }

        const nextEntry = Object.entries(this.timeline)
            .sort((x) => x[1])
            .filter((x) => x[1] < current)
            .at(0);
        const nextTime = !!nextEntry ? nextEntry[1] : 0;

        return current >= this.remaining && this.remaining > nextTime;
    }

    get isInArrangementTime() {
        return this.remaining > 0 && this.in(TimelineKey.arrangement);
    }

    get isInTransitionTime() {
        return this.remaining > 0 && this.in(TimelineKey.transition);
    }

    get remainingTimeToPlaceBet() {
        return this.remaining - this.timeline.deal;
    }

    get running() {
        return !!this.runner;
    }

    get remaining() {
        return this._remaining;
    }

    set remaining(value: number) {
        this._remaining = value;
    }
}
