import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { BlackjackActions, Hand } from "../blackjack-service-messages";

@injectable()
export class HandsStore {
    constructor() {
        makeAutoObservable(this);
    }
    private readonly positionOrder = [1, 4, 2, 5, 3, 6];

    previousHandBets: { pos: number; bet: number }[] = [];
    hands: { [key: number]: Hand } = {};
    activeHandId = 0;
    activePosition = 0;
    winningHands: { [key: number]: Hand } = {};

    placeChip(position: number, betAmount: number) {
        const hand = this.hands[position] || { pos: position, bet: 0 };
        hand.bet += betAmount;
        this.hands = { ...this.hands, [position]: hand };
    }

    get totalBetAmount() {
        return Object.values(this.hands).reduce((total, hand) => total + hand.bet, 0);
    }

    setHands(hands: Hand[]) {
        this.hands = hands.reduce((acc, hand) => {
            acc[hand.pos] = hand;
            return acc;
        }, {});
        this.setPreviousHandBets();
    }

    setHand(hand: Hand) {
        this.hands = { ...this.hands, [hand.pos]: hand };
    }

    setActiveHand() {
        const activeHand = this.positionOrder.map((pos) => this.hands[pos]).find((hand) => hand && !hand.isStand);

        this.activeHandId = activeHand?.id ?? 0;
        this.activePosition = activeHand?.pos ?? 0;
    }

    settleHands(winningHands: { id: number; betwin: number }[]) {
        this.winningHands = winningHands.reduce((hands, winningHand) => {
            const hand = Object.values(this.hands).find((h) => h.id === winningHand.id);
            if (hand) {
                hand.betwin = winningHand.betwin ?? 0;
                hands[hand.pos] = hand;
            }
            return hands;
        }, {});
    }

    clearChip(position) {
        this.hands = { ...this.hands, [position]: { pos: position, bet: 0 } };
    }

    private setPreviousHandBets() {
        this.previousHandBets = Object.values(this.hands).map((hand) => ({
            pos: hand.pos,
            bet: hand.actions?.includes(BlackjackActions.DOUBLE) ? hand.bet / 2 : hand.bet,
        }));
    }
}
