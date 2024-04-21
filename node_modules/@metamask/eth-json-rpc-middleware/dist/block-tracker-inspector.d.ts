import type { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import type { Json, JsonRpcParams } from '@metamask/utils';
import type { PollingBlockTracker } from 'eth-block-tracker';
interface BlockTrackerInspectorMiddlewareOptions {
    blockTracker: PollingBlockTracker;
}
export declare function createBlockTrackerInspectorMiddleware({ blockTracker, }: BlockTrackerInspectorMiddlewareOptions): JsonRpcMiddleware<JsonRpcParams, Json>;
export {};
