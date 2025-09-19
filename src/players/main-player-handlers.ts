import { inject, injectable } from "inversify";
import { GameServiceMessage, IMultipleHandlers } from "../shared";
import { MainPlayerStore } from "./main-player-store";

@injectable()
export class MainPlayerHandlers implements IMultipleHandlers {
    constructor(@inject(MainPlayerStore) protected readonly store: MainPlayerStore) {}

    handleStakeLevel(stakeLevel: GameServiceMessage.UserStakeLevel) {
        const currentStakeLevel = { ...this.store.stakeLevel };
        this.store.setStakeLevel(stakeLevel);
        this.store.showNoticeChangeStakeLevel(stakeLevel, currentStakeLevel);
    }

    handlePlayerProfile(profile: GameServiceMessage.User) {
        profile?.name && (this.store.name = profile.name);
        profile?.avatarId && (this.store.avatarId = profile.avatarId);
        profile?.rate && (this.store.rate = profile.rate);
        profile?.multiplier && (this.store.multiplier = profile.multiplier);
        profile?.playerNickname && (this.store.playerNickname = profile.playerNickname);
        profile?.playerAvatarUrl && (this.store.playerAvatarUrl = profile.playerAvatarUrl);
        this.store.setBalance(profile?.red, profile?.scoins, 0);
    }

    eventHandleList = [
        {
            name: GameServiceMessage.UserStakeLevel.eventName,
            handle: this.handleStakeLevel,
        },
        {
            name: GameServiceMessage.User.eventName,
            handle: this.handlePlayerProfile,
        },
    ];
}
