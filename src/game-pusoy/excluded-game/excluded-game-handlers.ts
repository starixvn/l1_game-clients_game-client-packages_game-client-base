import { inject, injectable } from "inversify";
import { AppHandlers } from "../../app/app-handlers";
import { AuthStore } from "../../auth/auth-store";
import { NoticeInfo, NoticeStore, NoticeType } from "../../game/notices";
import { RoundTimeStore } from "../rounds";
import { GameServiceMessage, IHandler } from "../../shared";
import { Translator } from "../../shared/utils/localization-manager";

@injectable()
export class NoPermissionHandlers implements IHandler<void> {
    name = GameServiceMessage.notPermittedToPlay;

    constructor(
        @inject(NoticeStore) protected readonly noticeStore: NoticeStore,
        @inject(AppHandlers.BackToOperatorLobby) protected readonly backToOperatorLobby: AppHandlers.BackToOperatorLobby,
        @inject(AuthStore) protected readonly authStore: AuthStore,
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore
    ) {}

    handle() {
        const goToLobby = () => {
            this.backToOperatorLobby.handle();
        };

        const gameName = Translator.gameTranslate("game_name");
        this.noticeStore.addNotice({
            message: Translator.getMessageFollowSystem(this.authStore.system, "game_excluded", { gameName }),
            title: Translator.commonTranslate("notice"),
            type: NoticeType.Info,
            onClose: goToLobby,
            noticeInfo: NoticeInfo.ExcludedGame,
        });

        this.roundTimeStore.stop();
    }
}
