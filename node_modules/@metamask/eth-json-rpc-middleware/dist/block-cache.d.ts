import type { Json, JsonRpcParams } from '@metamask/utils';
import type { PollingBlockTracker } from 'eth-block-tracker';
import type { JsonRpcCacheMiddleware } from './types';
interface BlockCacheMiddlewareOptions {
    blockTracker?: PollingBlockTracker;
}
export declare function createBlockCacheMiddleware({ blockTracker, }?: BlockCacheMiddlewareOptions): JsonRpcCacheMiddleware<JsonRpcParams, Json>;
export {};
