import { EventEmitter2 } from "eventemitter2";
import { injectable } from "inversify";

export interface IHandler<Input, Output = any> {
    name?: string;

    handle(input: Input): Output;
}

export interface IMultipleHandlers {
    eventHandleList: IHandler<any>[];
}

@injectable()
export class Mediator {
    private readonly event = new EventEmitter2({ maxListeners: 0 });

    readonly multipleKeyEvents: string[] = [];

    registerHandler(handler: IHandler<any>) {
        if (!!handler.name) {
            this.event.on(handler.name, handler.handle.bind(handler));
            this.addMultipleKeyEvent(handler.name);
        }
    }

    registerHandlers(handlers: IMultipleHandlers) {
        if (handlers && handlers.eventHandleList?.length > 0) {
            handlers.eventHandleList?.forEach((handler) => {
                this.event.on(handler.name, handler.handle.bind(handlers));
                this.addMultipleKeyEvent(handler.name);
            });
        }
    }

    addMultipleKeyEvent(name: string) {
        const keys = name.split(",");
        if (keys.length < 2) {
            return;
        }

        this.multipleKeyEvents.push(name);
    }

    onAny(handler: (...params: any[]) => void) {
        this.event.onAny(handler);
    }

    emit(event: string, ...value: any[]) {
        this.event.emit(event, ...value);
    }
}
