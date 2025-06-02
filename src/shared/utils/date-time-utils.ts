import moment from "moment";

export namespace DateTimeUtils {
    export const getStringDateByTime = (time: string) => {
        return moment(new Date(time)).format("HH:mm DD/MM/YYYY");
    };

    export const formatDateTime = (time: string) => {
        return moment(new Date(time)).format("HH:mm:ss DD/MM/YYYY");
    };

    export const getStringHourByTime = (time: string) => {
        return moment(new Date(time)).format("HH:mm:ss");
    };

    export const getStringDate = (time: string) => {
        return moment(new Date(time)).format("DD/MM/YYYY");
    };

    export const getStringDate1 = (time: string) => {
        return moment(new Date(time)).format("MM/DD/YYYY");
    };

    export const getStringDateByTimeGMT8 = (time: Date) => {
        return moment(time).utcOffset("+08:00").format("HH:mm DD/MM/YYYY");
    };

    export const getStringDateNow = () => {
        return moment().format("DDMMYYYY");
    };

    export const getString12HourByTime = (time: string) => {
        return moment(new Date(time)).format("hh:mm:ss A");
    };

    export const convertDurationToClockTime = (duration: number, formatTime: string) => {
        return moment.utc(duration * 1000).format(formatTime);
    };
}
