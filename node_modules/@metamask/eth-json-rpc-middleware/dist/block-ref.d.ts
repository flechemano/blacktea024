import type { SafeEventEmitterProvider } from '@metamask/eth-json-rpc-provider';
import type { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import type { Json, JsonRpcParams } from '@metamask/utils';
import type { PollingBlockTracker } from 'eth-block-tracker';
interface BlockRefMiddlewareOptions {
    blockTracker?: PollingBlockTracker;
    provider?: SafeEventEmitterProvider;
}
export declare function createBlockRefMiddleware({ provider, blockTracker, }?: BlockRefMiddlewareOptions): JsonRpcMiddleware<JsonRpcParams, Json>;
export {};
