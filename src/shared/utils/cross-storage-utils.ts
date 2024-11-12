import { BrowserDomUtils } from "./browser-dom-utils";
import { StorageManager } from "./storage-manager";
export namespace CrossStorageUtils {
    export const set = (key: string, data: any, exactName = false) => {
        StorageManager.set(key, data, exactName);

        BrowserDomUtils.postMessageToParent({ saveStorage: { key: data } });
    };

    export const get = (key: string, exactName = false) => {
        return new Promise((resolve) => {
            const listener = (event: MessageEvent) => {
                if (event.data?.loadStorage?.[key]) {
                    window.removeEventListener("message", listener);
                    const data = event.data?.loadStorage?.[key];
                    StorageManager.set(key, data, exactName);
                    resolve(data);
                }
            };
            window.addEventListener("message", listener);
            BrowserDomUtils.postMessageToParent({ loadStorage: { keys: [key] } });
        });
    };
}
