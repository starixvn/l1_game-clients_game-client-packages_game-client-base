import { inject, injectable } from "inversify";
import { HandHandlers } from "../hands";
import { DealHandler } from "./deal-handler";
import { IHandler } from "../../shared";

@injectable()
export class ClearHandler implements IHandler<number | undefined> {
    constructor(
        @inject(HandHandlers) protected readonly handHandlers: HandHandlers,
        @inject(DealHandler) protected readonly dealHandler: DealHandler
    ) {}

    handle(handsAmount = 1) {
        for (let i = 1; i <= handsAmount; i++) {
            this.handHandlers.clearChip(i);
        }
    }
}
