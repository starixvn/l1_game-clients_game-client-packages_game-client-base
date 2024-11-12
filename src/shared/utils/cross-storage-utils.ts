import { BrowserDomUtils } from "./browser-dom-utils";
import { StorageManager } from "./storage-manager";
export namespace CrossStorageUtils {
    export const set = (key: string, data: any) => {
        StorageManager.set(key, data);

        BrowserDomUtils.postMessageToParent({ saveStorage: { key, data } });
    };

    export const get = (key: string) => {
        return new Promise((resolve) => {
            const listener = (event: MessageEvent) => {
                if (event.data?.loadStorage?.[key]) {
                    window.removeEventListener("message", listener);
                    const data = event.data?.loadStorage?.[key];
                    StorageManager.get(key, data);
                    resolve(data);
                }
            };
            window.addEventListener("message", listener);
            BrowserDomUtils.postMessageToParent({ loadStorage: { keys: [key] } });
        });
    };
}
