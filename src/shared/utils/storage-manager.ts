interface IActionStorage {
    remove: (name: string) => void;
    get: (name: string) => string | object;
    set: (name: string, value: string | object, expiresDay?: number) => void;
    isAvailable: () => boolean;
}

declare global {
    interface Window {
        localMemory: object;
    }
}

export class LocalStorage implements IActionStorage {
    remove(name: string) {
        localStorage.removeItem(name);
    }

    get(name: string) {
        const storage = localStorage.getItem(name);
        if (!storage) {
            return null;
        }
        try {
            return JSON.parse(storage);
        } catch (error) {
            console.warn(`LocalStorage ${name} can not parse`);
            return null;
        }
    }

    set(name: string, value: string | object) {
        localStorage.setItem(name, JSON.stringify(value));
    }

    isAvailable() {
        const test = "test storage";
        try {
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.log("Browser not support Local Storage");
            return false;
        }
    }
}

export class Memory implements IActionStorage {
    localMemory: any;
    constructor() {
        window.localMemory = {};
        this.localMemory = window.localMemory;
    }

    remove(name: string) {
        delete this.localMemory[name];
    }

    get(name: string) {
        return this.localMemory[name] ? this.localMemory[name] : null;
    }

    set(name: string, value: any) {
        this.localMemory[name] = value;
    }

    isAvailable() {
        return true;
    }
}

export class StorageManager {
    static supportStorage: IActionStorage;
    static prefixKey: string;

    private static initialize() {
        if (!StorageManager.supportStorage) {
            const allStorage = [new LocalStorage(), new Memory()];
            StorageManager.supportStorage = allStorage.filter((storage) => storage.isAvailable())[0];
        }
    }

    static getCurrentStorage() {
        StorageManager.initialize();
        return StorageManager.supportStorage;
    }

    static get(name: string, exactName = false) {
        if (exactName) {
            return StorageManager.getCurrentStorage().get(name);
        }
        return StorageManager.getCurrentStorage().get(StorageManager.getName(name));
    }

    static set(name: string, value: string | object, exactName = false) {
        if (exactName) {
            StorageManager.getCurrentStorage().set(name, value);
            return;
        }
        StorageManager.getCurrentStorage().set(StorageManager.getName(name), value);
    }

    static remove(name: string, exactName = false) {
        if (exactName) {
            StorageManager.getCurrentStorage().remove(name);
            return;
        }
        StorageManager.getCurrentStorage().remove(StorageManager.getName(name));
    }

    static setPrefixKey(prefixKey: string) {
        StorageManager.prefixKey = prefixKey;
    }

    static getName(name: string) {
        return StorageManager.prefixKey ? `${StorageManager.prefixKey}_${name}` : name;
    }
}

export const localStorageKeys = {
    session: "ss",
    directMode: "direct-mode",
    returnUrl: "rurl",
    lobbyUrl: "lurl",
    playerSetting: "player-setting",
    playerIngameSelections: "player-selections",
    ruleReBet: "ruleRB",
    parentUrl: "purl",
    isApp: "app",
    gameIdsSupportBoostedOddsForInstantSite: "gameIdsSupportBoostedOddsForInstantSite",
    gameUserSetting: "game-user-setting",
    permanentGameUserSetting: "permanent-game-user-setting",
    operator: "op",
    portraitDirectMode: "portrait-direct-mode",
    supportedGamesId: "supportedGamesId",
    standaloneMode: "standalone-mode",
};
