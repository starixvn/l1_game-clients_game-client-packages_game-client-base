import { Container } from "inversify";
import * as Auth from "../auth";
import * as ChipSetting from "../chip-setting";
import * as SiteConfigs from "../configs";
import { ConnectionHandlers } from "../game/connection";
import { DisableGameHandlers as OldDisableGameHandlers } from "../game/disabled-game";
import { GameSetting as OldGameSetting } from "../game/game-configs";
import { HideGameHandler as OldHideGameHandler } from "../game/hide-game";
import {
    RoundStore as OldRoundStore,
    RoundTimeStore as OldRoundTimeStore,
    RoundTimeHandlers as OldRoundTimeHandlers,
    RoundHandlers as OldRoundHandlers,
} from "../game/rounds";
import * as Notification from "../notification";
import * as Players from "../players";
import * as UnderMaintenance from "../under-maintenance";
import { InGameHandler } from "./connection";
import { DisableGameHandlers } from "./disabled-game";
import * as Pusoy from "./export";
import { GameSetting, GameConfigStore } from "./game-configs";
import { HideGameHandler } from "./hide-game";
import { RoundStore, RoundTimeHandlers, RoundTimeStore, RoundHandlers } from "./rounds";
import { BetHandler as OldBetHandler } from "../game/bets";
import { GameConfigStore as OldGameConfigStore } from "../game/game-configs";
import { BetHandler } from "../game-pusoy/bets/bet-handler";

export const features = [Auth, Players, SiteConfigs, Pusoy, Notification, UnderMaintenance, ChipSetting];

export const onContainerCreated = (container: Container, setting: GameSetting) => {
    container.bind(GameSetting).toConstantValue(setting);
    container.bind(OldGameSetting).toConstantValue(setting as any);

    container.bind(OldBetHandler).to(BetHandler);
    container.bind(OldRoundTimeHandlers).to(RoundTimeHandlers as any);
    container.bind(OldDisableGameHandlers).to(DisableGameHandlers as any);
    container.bind(ConnectionHandlers.InGameHandler).to(InGameHandler as any);
    container.bind(OldHideGameHandler).to(HideGameHandler as any);

    container.bind(RoundStore).to(RoundStore as any);
    container.bind(OldRoundStore).toService(RoundStore as any);

    container.bind(RoundTimeStore).to(RoundTimeStore);
    container.bind(OldRoundTimeStore).toService(RoundTimeStore as any);

    container.bind(GameConfigStore).to(GameConfigStore as any);
    container.bind(OldGameConfigStore).toService(GameConfigStore as any);

    // container.bind(RoundHandlers).to(RoundHandlers as any);
    container.bind(OldRoundHandlers).to(RoundHandlers as any);
};
