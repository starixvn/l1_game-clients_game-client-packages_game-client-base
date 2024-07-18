import { Container } from "inversify";
import * as Auth from "../auth";
import * as ChipSetting from "../chip-setting";
import * as SiteConfigs from "../configs";
import { ConnectionHandlers } from "../game/connection";
import { DisableGameHandlers as OldDisableGameHandlers } from "../game/disabled-game";
import { GameSetting as OldGameSetting } from "../game/game-configs";
import { HideGameHandler as OldHideGameHandler } from "../game/hide-game";
import { RoundStore as OldRoundStore } from "../game/rounds";
import * as Notification from "../notification";
import * as Players from "../players";
import * as UnderMaintenance from "../under-maintenance";
import { InGameHandler } from "./connection";
import { DisableGameHandlers } from "./disabled-game";
import * as Pusoy from "./export";
import { GameSetting } from "./game-configs";
import { HideGameHandler } from "./hide-game";
import { RoundStore } from "./rounds";

export const features = [Auth, Players, SiteConfigs, Pusoy, Notification, UnderMaintenance, ChipSetting];

export const onContainerCreated = (container: Container) => {
    container.bind(OldRoundStore).to(RoundStore as any);
    container.bind(OldDisableGameHandlers).to(DisableGameHandlers as any);
    container.bind(ConnectionHandlers.InGameHandler).to(InGameHandler as any);
    container.bind(OldGameSetting).to(GameSetting as any);
    container.bind(OldHideGameHandler).to(HideGameHandler as any);
};
