import { Socket, io } from "socket.io-client/dist/socket.io.js";
import { io as ioMsgPack } from "socket.io-client/dist/socket.io.msgpack.min.js";
import { SiteConfigs } from "../../configs";

export namespace SocketUtils {
    export const createSocket = (socketUri: string, siteConfigs: SiteConfigs, customizeOptions?: any) => {
        let socket: Socket = null;
        const optionsDefault = {
            socketUri,
            transports: ["websocket"],
            upgrade: false,
            forceNew: true,
        };
        const options = { ...optionsDefault, ...customizeOptions };

        if (siteConfigs.enableMsgpackParserAllGames) {
            socket = ioMsgPack(options.socketUri, options);
        } else {
            socket = io(options.socketUri, options);
        }

        return socket;
    };
}
