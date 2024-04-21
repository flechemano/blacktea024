import type { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import type { Json, JsonRpcParams } from '@metamask/utils';
import type { PollingBlockTracker } from 'eth-block-tracker';
interface BlockRefRewriteMiddlewareOptions {
    blockTracker?: PollingBlockTracker;
}
export declare function createBlockRefRewriteMiddleware({ blockTracker, }?: BlockRefRewriteMiddlewareOptions): JsonRpcMiddleware<JsonRpcParams, Json>;
export {};
