import { inject, injectable } from "inversify";
import { AroundTablePlayersStore } from "./around-table-players-store";

@injectable()
export class MaxBalanceDisplay {
    constructor(@inject(AroundTablePlayersStore) protected readonly aroundTablePlayersStore: AroundTablePlayersStore) { }

    async handle() {
        this.aroundTablePlayersStore.updateMaxBalanceDisplay();
    }
}
