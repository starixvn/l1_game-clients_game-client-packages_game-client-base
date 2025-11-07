import { AppTypes } from "../constants/app-type";
import { GameServiceMessage } from "../models";
import { FormatUtils } from "./format-utils";
import { Translator } from "./localization-manager";

export namespace ErrorUtils {
    const ErrorCodeDictionary = {
        "1000": "message_error_occurred",
        "1001": "message_session_timeout",
        "1002": "message_session_timeout",
        "7001": "message_session_timeout",
        "1007": "message_error_occurred",
        "2001": "splash_login_failed",
        "2002": "message_close_account",
        "2003": "message_account_notexist",
        "2004": "message_ip_restricted",
        "2005": "message_account_blacklist",
        "3001": "message_error_occurred",
        "3002": "message_insufficient_fund",
        "3003": "message_limitbet_exceeded",
        "3004": "message_player_unpermitted_play",
        "3005": "message_error_occurred",
        "3006": "message_win_limit_hit",
        "3007": "message_lose_limit_hit",
        "3008": "message_limit_bet_not_defined",
        "3009": "message_limit_bet_updated",
        "3010": "message_account_suspended",
        "3013": "message_account_suspended",
        "3014": "message_unavailable_game",
        "3015": "message_error_occurred_full",
        "3016": "message_error_occurred_full",
        "3017": "message_error_occurred_full",
        "4001": "message_error_occurred",
        "4003": "message_error_occurred",
        "4004": "message_error_occurred",
        "4006": "message_error_occurred",
        "4007": "message_error_occurred",
        "4008": "message_error_occurred",
        "4012": "message_user_not_found",
        "5002": "message_network_error",
        "5003": "message_sys_maintenance",
        SB0001: "message_error_occurred",
        SB0002: "message_session_timeout",
        SB0003: "message_play_on_otherdevice",
        SB0004: "message_server_error",
        SB0005: "message_invalid_data",
        SB0006: "message_unauthorized",
        SB0007: "message_server_not_found",
        SB0008: "message_account_signout",
        SB0009: "message_processing_action",
        SB0010: "message_connection_failed",
        SB0011: "message_session_expired",
        SB0012: "message_nickname_distance",
        SB0013: "message_nickname_character",
        SB0015: "message_exist_nickname",
        SB1900: "message_placebet_failed",
        SB1901: "message_endgame_failed",
        SB1902: "message_get_balance_failed",
        SB1903: "message_enter_portal_failed",
        SB1904: "message_jackpot_processing",
        SB1905: "message_placebet_next_round",
        SB1906: "message_cannot_bet",
        SB1907: "not_enough_money",
        SB1908: "message_not_enough_scoin",
        SB1909: "message_min_bet_notice",
        SB1910: "message_option_maxbet",
        SB1911: "message_round_maxbet",
        SB1912: "invalid_hand_id",
        SB1913: "hand_already_splitted",
        SB1914: "cant_split_child_hand",
        SB1915: "cant_double_hand",
        SB1916: "cant_hit",
        SB1917: "cards_not_equal",
        SB1918: "hand_is_stand",
        SB1919: "invalid_position",
        SB1920: "hand_not_active",
        SB1921: "invalid_deal_hands",
        SB1922: "message_processing_action",
        SB1923: "message_invalid_deal_dueto_running_round",
        SB1936: "min_bet_hand",
        SB1937: "max_stake_hand",
        SB1938: "cant_split_hand",
        SB1924: "message_maxbet_of_oneofchoice_reached",
        SB1925: "bet_amount_of_any_choice_incorrect",
        SB1926: "message_invalid_bet_choice",
        SB1927: "one_choice_allowed",
        SB1928: "message_invalid_payline",
        SB1929: "invalid_free_spin",
        SB1930: "invalid_stake_level",
        SB1931: "message_invalid_bonus",
        SB1932: "message_opened_bonus",
        SB1933: "game_excluded",
        SB1934: "not_enough_spin",
        SB1935: "invalid_bet",
        SB1939: "message_hedge_bet",
        SB1940: "message_invalid_cashout",
        SB1941: "message_invalid_value_cashout",
        SB1942: "message_invalid_jackpot",
        SB1943: "message_opened_jackpot",
        SB3017: "message_error_occurred",
        SB3018: "message_error_occurred",
        SB3023: "message_error_claim_expired",
        SB3030: "cancel_promotion_message"
    };

    const CommonErrorList = [
        "message_error_occurred",
        "message_session_timeout",
        "splash_login_failed",
        "message_close_account",
        "message_account_notexist",
        "message_ip_restricted",
        "message_account_blacklist",
        "message_user_not_found",
        "message_sys_maintenance",
        "message_network_error",
    ];

    export const parseErrorCode = (errorCode: string, isPlaceBet = false, system?: number) => {
        let message = getErrorCodeMessage(errorCode, system);
        const errorKey = `${ErrorCodeDictionary[errorCode]}`;
        if (isPlaceBet && CommonErrorList.includes(errorKey) && system === AppTypes.Instant) {
            message += "_place_bet";
        }

        return message;
    };

    const getErrorCodeMessage = (errorCode: string, system: number) => {
        const keyPrefix = getKeyPrefix(system);

        if (!ErrorCodeDictionary[errorCode]) {
            console.warn(`Error code not found: ${errorCode}`);
            return `${keyPrefix}.message_error_occurred`;
        }

        const errorMessage = ErrorCodeDictionary[errorCode];

        return `${keyPrefix}.${errorMessage}`;
    };

    const getKeyPrefix = (system: number) => {
        if (system === AppTypes.Instant) {
            return "InstantGame";
        }

        return "Common";
    };

    export const createOptionForHedgeBetGroup = (hedgeBetGroup: string[]) => {
        const option = {};
        hedgeBetGroup?.forEach((choice, index) => {
            option[`betChoice${index + 1}`] = Translator.gameTranslate(`glossary_${choice}`);
        });
        return option;
    };

    export const getErrorMessage = (notice: GameServiceMessage.Notice, system: number) => {
        const { errorCode, hedgeBetGroup, gameRoundId } = notice;
        const option = { errorCode };

        if (!!hedgeBetGroup) {
            Object.assign(option, createOptionForHedgeBetGroup(hedgeBetGroup));
        }

        if (!!notice.gameTypeId) {
            Object.assign(option, { gameName: Translator.gameTranslate("game_name") });
        }

        if (!!notice.minBet) {
            Object.assign(option, { minBet: FormatUtils.numberWithCommas(notice.minBet) });
        }

        if (!!notice.maxBet) {
            Object.assign(option, { maxBet: FormatUtils.numberWithCommas(notice.maxBet) });
        }

        if (!!gameRoundId) {
            Object.assign(option, { gameRoundId });
        }

        const key = parseErrorCode(errorCode, !!notice.isPlaceBetFailed, system);
        return Translator.translate(key, option);
    };

    export const isSessionTimeoutError = (errorCode: string): boolean => {
        const expectedTokenErrorCodes = ["1001", "1002", "SB0002", "SB0011", "7001"];
        return expectedTokenErrorCodes.includes(errorCode);
    };
}
