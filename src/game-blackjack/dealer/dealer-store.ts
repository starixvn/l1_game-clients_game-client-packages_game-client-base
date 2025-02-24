import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { Card } from "../blackjack-service-messages";

@injectable()
export class DealerStore {
    constructor() {
        makeAutoObservable(this);
    }

    cards: Card[] = [];

    setCards(cards: Card[]) {
        this.cards = cards;
    }
}
