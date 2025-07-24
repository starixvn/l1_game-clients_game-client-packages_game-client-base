import * as _ from "lodash";
import Polyglot from "node-polyglot";
import { AppTypes } from "./../constants/app-type";
import { StorageManager } from "./storage-manager";

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
    "en-US": "en",
    "en-GB": "en",
    "es-ES": "es",
    "fr-FR": "fr",
    "de-DE": "de",
    "zh-CN": "zh_cn",
    "ja-JP": "ja",
    "pt-BR": "pt",
    "ru-RU": "ru",
    "it-IT": "it",
    "ko-KR": "ko",
    "ar-SA": "ar",
    "hi-IN": "hi",
    "nl-NL": "nl",
    "sv-SE": "sv",
    "pl-PL": "pl",
    "tr-TR": "tr",
    "id-ID": "id",
    "th-TH": "th",
    "vi-VN": "vi",
    "da-DK": "da",
    "fi-FI": "fi",
    "no-NO": "no",
    "cs-CZ": "cs",
    "hu-HU": "hu",
    "el-GR": "el",
    "he-IL": "he",
    "uk-UA": "uk",
    "ro-RO": "ro",
    "sk-SK": "sk",
    "hr-HR": "hr",
    "bg-BG": "bg",
    "et-EE": "et",
    "lv-LV": "lv",
    "lt-LT": "lt",
    "sl-SI": "sl",
    "sr-RS": "sr",
    "en-CA": "en",
    "fr-CA": "fr",
    "es-MX": "es",
    "pt-PT": "pt",
    "zh-TW": "zh_tw",
    "en-AU": "en",
    "en-NZ": "en",
    "de-AT": "de",
    "de-CH": "de",
    "fr-CH": "fr",
    "it-CH": "it",
    "ar-EG": "ar",
    "ar-AE": "ar",
    "ar-DZ": "ar",
    "ar-MA": "ar",
    "ar-IQ": "ar",
    "ar-JO": "ar",
    "ar-KW": "ar",
    "ar-LB": "ar",
    "ar-OM": "ar",
    "ar-QA": "ar",
    "ar-SY": "ar",
    "ar-TN": "ar",
    "bn-BD": "bn",
    "bn-IN": "bn",
    "gu-IN": "gu",
    "kn-IN": "kn",
    "ml-IN": "ml",
    "mr-IN": "mr",
    "pa-IN": "pa",
    "ta-IN": "ta",
    "te-IN": "te",
    "ur-PK": "ur",
    "ko-KP": "ko",
    "ms-MY": "ms",
    "ms-BN": "ms",
    "ms-SG": "ms",
    "jv-ID": "jv",
    "su-ID": "su",
    "am-ET": "am",
    "sw-KE": "sw",
    "sw-TZ": "sw",
    "af-ZA": "af",
    "zu-ZA": "zu",
    "xh-ZA": "xh",
    "ga-IE": "ga",
    "cy-GB": "cy",
    "gd-GB": "gd",
    "eu-ES": "eu",
    "ca-ES": "ca",
    "gl-ES": "gl",
    "eo-EO": "eo",
    "az-AZ": "az",
    "be-BY": "be",
    "ka-GE": "ka",
    "kk-KZ": "kk",
    "ky-KG": "ky",
    "mn-MN": "mn",
    "ne-NP": "ne",
    "si-LK": "si",
    "lo-LA": "lo",
    "km-KH": "km",
    "my-MM": "my",
    "ug-CN": "ug",
    "ps-AF": "ps",
    "fa-IR": "fa",
    "dv-MV": "dv",
    "fo-FO": "fo",
    "is-IS": "is",
    "lb-LU": "lb",
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
    public currentLanguageId: string = null;

    public init(options: TranslationOptions) {
        this.options = options;
        this.loadPolygrot();
        this.isReady = true;
        if (options.isUseTolgeeRealTime) {
            this.loadTolgee(options);
        } else {
            options.onLoaded && options.onLoaded();
        }
        StorageManager.set(`current_language`, options.languageId);
        this.currentLanguageId = options.languageId;
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
            ...globalThis.localeMapping,
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
