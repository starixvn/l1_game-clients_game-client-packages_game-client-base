import { ignoreErrors as constantIgnoreErrors } from "../constants/ignore-errors";

declare global {
    interface Window {
        Sentry: any;
    }
}

export const sentryLogger = {
    dsn: "",
    env: "",
    identifier: "",
    ignoreErrors: [],
    loaded: false,

    isEnabled: () => {
        return sentryLogger.dsn && document && document.head;
    },
    loadScript: () => {
        if (window.Sentry && !sentryLogger.loaded) {
            window.Sentry.init({
                dsn: sentryLogger.dsn,
                environment: sentryLogger.env,
                maxValueLength: 5000,
                ignoreErrors: sentryLogger.ignoreErrors,
            });
            window.Sentry.setTag("game-client", sentryLogger.identifier);

            sentryLogger.loaded = true;
        }
    },
    start: ({ dsn = "", env = "", identifier = "", browserUrl = "", ignoreErrors = [] }) => {
        try {
            if (!dsn) {
                return;
            }
            sentryLogger.dsn = dsn;
            sentryLogger.env = env;
            sentryLogger.identifier = identifier;
            sentryLogger.ignoreErrors = ignoreErrors.length === 0 ? constantIgnoreErrors : ignoreErrors;

            const sentryScript = document?.createElement("script");
            if (sentryScript) {
                sentryScript.setAttribute("id", "sentry-logger");
                sentryScript.setAttribute("src", browserUrl);
                sentryScript.setAttribute("integrity", "sha384-+ysfQckQvwCB5SppH41IScIz/Iynt2pePnJNMl+D7ZOzDJ+VYhQEuwB0pA60IDM0");
                sentryScript.setAttribute("crossorigin", "anonymous");
                sentryScript.onload = () => {
                    sentryLogger.loadScript();
                };
            }

            document?.head.appendChild(sentryScript);
        } catch (err) {
            console.log(err);
        }
    },

    logInfo: (message: string) => {
        if (sentryLogger.isEnabled()) {
            sentryLogger.loadScript();
            window.Sentry?.captureMessage(`${sentryLogger.identifier}: ${message}`);
        }
    },

    logError: (exception: string | Error) => {
        if (sentryLogger.isEnabled()) {
            sentryLogger.loadScript();
            window.Sentry?.captureMessage(`${sentryLogger.identifier}: ${exception}`, "error");
        }
    },
};
