import * as _ from "lodash";
import Polyglot from "node-polyglot";
import { AppTypes } from "./../constants/app-type";
import { localStorageKeys, StorageManager } from "./storage-manager";

export class TranslationOptions {
    languageId: string;
    tolgeeUrl?: string;
    isUseTolgeeRealTime: boolean;
    getStaticData?: (languageId) => {
        [key: string]: {
            [key: string]: string;
        };
    };
    onLoaded?: () => void;
    availableLanguages?: string[];
    gameNamespaces?: string[];
}

const LOCALE_MAPPING = {
    "vi-VN": "vi",
    "en-US": "en",
    "en-UK": "en",
    "th-TH": "th",
    "id-ID": "id",
    "zh-CN": "zh_cn",
    "zh-TW": "zh_tw",
    "ja-JP": "ja",
    "es-ES": "es",
};

export class InterpolationOptions {
    [key: string]: string | number;
}

class TolgeeLoader {
    constructor(private readonly tolgeeUrl) {}

    public async loadTolgee(languageId = "en") {
        const languages: {
            [key: string]: {
                [key: string]: string;
            };
        } = {};

        try {
            const tolgeeUrl = this.tolgeeUrl + languageId;
            const statusResponse = await fetch(tolgeeUrl);
            const tolgeeData = await statusResponse.json();
            const groupedByNamespace = _.groupBy(tolgeeData._embedded.keys, (key) => key.keyNamespace);

            if (Object.keys(groupedByNamespace).length > 0) {
                Object.keys(groupedByNamespace).forEach((key) => {
                    const namespaceTranslation = {};

                    groupedByNamespace[key].forEach((element) => {
                        namespaceTranslation[element.keyName] = element.translations[languageId].text;
                    });

                    languages[key] = namespaceTranslation;
                });
                console.log("loaded tolgee real time");
            } else {
                console.log("load tolgee real time failed!");
            }
        } catch (e) {
            console.log(e);
        }

        return languages;
    }
}

export class TranslationManager {
    public defaultLanguageId = "en";
    public options: TranslationOptions;
    public isReady: boolean;
    private _polygrot: Polyglot;
    private _tolgeeLoader: TolgeeLoader;

    public init(options: TranslationOptions) {
        this.options = options;
        this.loadPolygrot();
        this.isReady = true;
        if (options.isUseTolgeeRealTime) {
            this.loadTolgee(options);
        } else {
            options.onLoaded && options.onLoaded();
        }
        StorageManager.set(localStorageKeys.currentLanguage, options.languageId);
    }

    private loadTolgee(options: TranslationOptions) {
        this._tolgeeLoader = new TolgeeLoader(options.tolgeeUrl);
        this._tolgeeLoader.loadTolgee(options.languageId).then((languages) => {
            this.loadPolygrot(languages);
            options.onLoaded && options.onLoaded();
        });
    }

    public async changeLanguage(languageId: string) {
        if (languageId == null || languageId === "") {
            return;
        }

        this.options.languageId = languageId;

        if (this.options.isUseTolgeeRealTime) {
            this.loadTolgee(this.options);
        } else {
            this.loadPolygrot();
        }
    }

    public loadPolygrot(languages?: { [key: string]: { [key: string]: string } }) {
        const languageData = languages ?? this.options.getStaticData(this.options.languageId);

        this._polygrot = new Polyglot({ phrases: languageData, allowMissing: true });
    }

    public translate(key: string, options?: InterpolationOptions) {
        try {
            if (this.options != null) {
                return this.getDataTranslation(key, options);
            }
        } catch (e) {
            console.log(e);
        }

        return `Not Options: ${key}`;
    }

    public t = this.translate;

    private getDataTranslation(key: string, options?: InterpolationOptions) {
        if (this.options.getStaticData == null || key == null || key === "") {
            return `Data null: ${key}`;
        }

        return this._polygrot.t(key, options);
    }

    private toLanguageId(localeCode: string) {
        const localeMapping = {
            ...LOCALE_MAPPING,
            ...(globalThis?.localeMapping ?? {}),
        };

        return localeMapping[localeCode] || this.defaultLanguageId;
    }

    public getLanguageId() {
        let languageId = (StorageManager.get(`current_language`) ?? this.defaultLanguageId) as string;

        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.has("lang")) {
            languageId = this.toLanguageId(urlParams.get("lang"));
        } else if (urlParams.has("params")) {
            const decodedParams = new URLSearchParams(atob(urlParams.get("params")));
            if (decodedParams.has("lang")) {
                languageId = this.toLanguageId(decodedParams.get("lang"));
            }
        }

        if (this.options && !this.options.availableLanguages?.includes(languageId)) {
            return this.defaultLanguageId;
        }

        return languageId;
    }

    public getCurrentLanguageId() {
        return this.options.languageId;
    }

    public getGameNamespace() {
        return this.options.gameNamespaces;
    }

    public loadTranslationResource() {
        const languageId = this.getLanguageId();
        StorageManager.set(`current_language`, languageId);

        console.log("Loaded language:" + languageId);
        this.changeLanguage(languageId);
    }

    public gameTranslate(key: string, options?: InterpolationOptions) {
        if (this.options.gameNamespaces) {
            for (const namespace of this.options.gameNamespaces) {
                const keyText = `${namespace}.${key}`;
                const text = this.translate(keyText, options);
                if (keyText !== text) {
                    return text;
                }
            }
        }

        return this.translate(key, options);
    }

    public commonTranslate(key: string, options?: InterpolationOptions) {
        if (this.options.gameNamespaces) {
            return this.translate(`Common.${key}`, options);
        }

        return this.translate(key, options);
    }

    public getMessageFollowSystem(system: number, key: string, options?: InterpolationOptions) {
        const mode: "common" | "instant" = system === AppTypes.Instant ? "instant" : "common";
        return Translator.getTranslate(key, mode, options);
    }

    private getTranslate(key: string, mode?: "game" | "common" | "instant", options?: InterpolationOptions) {
        const namespace = {
            game: this.options.gameNamespaces,
            common: "Common",
            instant: "InstantGame",
        };

        const prefix = namespace[mode];

        if (prefix) {
            key = `${prefix}.${key}`;
        }

        return this.translate(key, options);
    }
}

export const Translator = new TranslationManager();
