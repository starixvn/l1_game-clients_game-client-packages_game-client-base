import { Container } from "inversify";

import * as Auth from "./auth";
import * as ChipSetting from "./chip-setting";
import * as SiteConfigs from "./configs";
import * as Game from "./game";
import * as Notification from "./notification";
import * as Players from "./players";
import type { AnyConstructor } from "./shared";
import { FeatureLoader } from "./shared";
import * as UnderMaintenance from "./under-maintenance";
import * as GameConfiguration from "./game-configuration";

export interface IContainerOptions {
    onContainerCreated?: (container: Container) => void;

    disabledFeatures?: string[];

    enabledFeatures?: string[];

    globalContainer?: Container;

    features?: object[];
}

function serializeOptions(input: IContainerOptions): IContainerOptions {
    const defaultOptions: IContainerOptions = {
        onContainerCreated: () => {},
        disabledFeatures: [],
        globalContainer: null,
        enabledFeatures: [],
    };

    return Object.assign(defaultOptions, input);
}

export const defaultFeatures = [Auth, Players, SiteConfigs, Game, Notification, UnderMaintenance, ChipSetting, GameConfiguration];

export function getContainer(options: IContainerOptions = {}) {
    const { onContainerCreated, disabledFeatures, globalContainer, enabledFeatures, features } = serializeOptions(options);

    const container = new Container({
        autoBindInjectable: true,
        defaultScope: "Singleton",
    });

    container.parent = globalContainer;

    onContainerCreated(container);

    const featureLoaderOptions: FeatureLoader.IFeatureLoaderOptions = {
        container: container,
        disabledFeatures: disabledFeatures,
        enabledFeatures: enabledFeatures,
        features: features ?? defaultFeatures,
    };

    FeatureLoader.loadFeatures(featureLoaderOptions);

    return container;
}

export function buildObserverContainer(container: Container) {
    return {
        resolve: (ctor: AnyConstructor) => container.get(ctor),
    };
}
