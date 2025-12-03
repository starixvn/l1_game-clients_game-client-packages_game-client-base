import { METADATA_KEY } from "inversify";

declare global {
    namespace Reflect {
        function hasOwnMetadata(metadataKey: any, target: Object): boolean;
    }
}

export function isInjectable(ctor: Object) {
    return METADATA_KEY?.PARAM_TYPES != null && Reflect.hasOwnMetadata(METADATA_KEY.PARAM_TYPES, ctor);
}
