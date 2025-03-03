import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { UMInfo } from "sc-user-service-client/dist/auth";
import { ISessionInfo } from "../auth/auth-store";
import { AppTypes } from "../shared/constants/app-type";
import { URLParams } from "../shared/constants/url-params";
import { BrowserDomUtils, StorageManager, localStorageKeys } from "../shared/utils";

interface IUrlInfo {
    returnUrl?: string;
    ref?: string;
}

interface IDirectMode {
    session: string;
    isDirectMode: boolean;
    urlInfo: IUrlInfo;
}

export interface IPortraitDirectMode {
    session: string;
    isPortraitDirectMode: boolean;
}

export interface IPortraitMode {
    session: string;
    isPortraitMode: boolean;
}

@injectable()
export class AppStore {
    isUM = false;
    umInfo: UMInfo | null = null;
    isSessionTimeout = false;
    isDirectMode = false;
    isApp = false;
    isPlayForFun = false;
    urlInfo: IUrlInfo = {};
    isAutoCreateNickname = false;
    isLoading = true;
    isUserGesture = false;
    isTouchedScreen = false;
    isClearStorage = false;
    isPortraitDirectMode = false;
    isPortraitMode = false;

    constructor() {
        makeAutoObservable(this);
    }

    setUM(umInfo: UMInfo) {
        this.isUM = true;
        this.umInfo = umInfo;
        BrowserDomUtils.postMessageToParent({ isUnderMaintain: true, umInfo });
    }

    setURLStore(urlParams: URLSearchParams) {
        const refData = urlParams.get(URLParams.ref);
        const returnUrl = urlParams.get(URLParams.returnUrl);
        const appType = urlParams.get(URLParams.appType);

        if (refData) {
            if (this.isOpenDirectly(refData) || this.isPlayForFunMode(refData)) {
                this.isDirectMode = true;
                this.isAutoCreateNickname = true;
            }

            if (this.isPlayForFunMode(refData)) {
                this.isPlayForFun = true;
            }

            this.urlInfo.ref = refData;
        }

        if (returnUrl) {
            this.urlInfo.returnUrl = returnUrl;
        }

        const parentUrl = urlParams.get(URLParams.parentUrl);
        if (parentUrl) {
            StorageManager.set(localStorageKeys.parentUrl, parentUrl);
        }

        if (appType === AppTypes.App.toString()) {
            this.isApp = true;
        }

        if (JSON.parse(urlParams.get(URLParams?.isUserGesture))) {
            this.isUserGesture = true;
        }

        if (this.isOpenPortraitDirectly(appType)) {
            this.isPortraitDirectMode = true;
            this.isAutoCreateNickname = true;
        }

        if (JSON.parse(urlParams.get(URLParams?.isPortraitMode))) {
            this.isPortraitMode = true;
        }
    }

    private isPlayForFunMode(refData: string) {
        const directRef = ["d_operator_opendirectly", "m_operator_opendirectly"];
        return directRef.some((data) => data === refData);
    }

    private isOpenDirectly(refData: string) {
        const directRef = ["d_direct", "m_direct"];
        return directRef.some((data) => data === refData);
    }

    private isOpenPortraitDirectly(appType: string) {
        return appType === AppTypes.MobileDirect.toString();
    }

    saveDirectModeInfo() {
        const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
        const data: IDirectMode = {
            session: sessionInfo.session,
            isDirectMode: this.isDirectMode,
            urlInfo: this.urlInfo,
        };
        StorageManager.set(localStorageKeys.directMode, data);
    }

    savePortraitDirectModeInfo() {
        const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
        const data: IPortraitDirectMode = {
            session: sessionInfo.session,
            isPortraitDirectMode: this.isPortraitDirectMode,
        };
        StorageManager.set(localStorageKeys.portraitDirectMode, data);
    }

    savePortraitModeInfo() {
        const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
        const data: IPortraitMode = {
            session: sessionInfo.session,
            isPortraitMode: this.isPortraitMode,
        };
        StorageManager.set(localStorageKeys.portraitMode, data);
    }

    saveReturnUrl() {
        const { returnUrl } = this.urlInfo;
        returnUrl && StorageManager.set(localStorageKeys.returnUrl, returnUrl);
    }

    saveIsApp() {
        this.isApp && StorageManager.set(localStorageKeys.isApp, "true");
    }

    loadApp() {
        const isApp = !!StorageManager.get(localStorageKeys.isApp);
        this.isApp = isApp;
    }

    loadDirectMode() {
        const data = StorageManager.get(localStorageKeys.directMode) as IDirectMode;
        if (data) {
            const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
            if (sessionInfo.session === data.session) {
                this.isDirectMode = data.isDirectMode;
                this.urlInfo = data.urlInfo;
            }
        }
    }

    loadPortraitDirectMode() {
        const data = StorageManager.get(localStorageKeys.portraitDirectMode) as IPortraitDirectMode;
        if (data) {
            const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
            if (sessionInfo.session === data.session) {
                this.isPortraitDirectMode = data.isPortraitDirectMode;
            }
        }
    }

    loadPortraitMode() {
        const data = StorageManager.get(localStorageKeys.portraitMode) as IPortraitMode;
        if (data) {
            const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
            if (sessionInfo.session === data.session) {
                this.isPortraitMode = data.isPortraitMode;
            }
        }
    }

    loadReturnUrlAnd() {
        this.urlInfo.returnUrl = StorageManager.get(localStorageKeys.returnUrl)?.toString();
    }

    setTimeOut() {
        this.isSessionTimeout = true;
        BrowserDomUtils.postMessageToParent({ sessionTimeout: true });
    }
}
