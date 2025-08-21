import { inject, injectable } from "inversify";
import { AuthStore, UserService } from "../auth";
import { IHandler } from "../shared/mediator";
import { ChipSettingStore } from "./chip-setting-store";

@injectable()
export class ChipSettingHandler implements IHandler<void> {
    constructor(
        @inject(UserService) private readonly userService: UserService,
        @inject(ChipSettingStore) private readonly chipSettingStore: ChipSettingStore,
        @inject(AuthStore) private readonly authStore: AuthStore
    ) { }

    async handle() {
        const response = await this.userService.getChipSetting(this.authStore.session, this.authStore.username);
        this.chipSettingStore.updateChipColor(response?.chips || []);
    }
}
