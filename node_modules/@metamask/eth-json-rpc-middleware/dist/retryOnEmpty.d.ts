import type { SafeEventEmitterProvider } from '@metamask/eth-json-rpc-provider';
import type { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import type { Json, JsonRpcParams } from '@metamask/utils';
import type { PollingBlockTracker } from 'eth-block-tracker';
interface RetryOnEmptyMiddlewareOptions {
    provider?: SafeEventEmitterProvider;
    blockTracker?: PollingBlockTracker;
}
export declare function createRetryOnEmptyMiddleware({ provider, blockTracker, }?: RetryOnEmptyMiddlewareOptions): JsonRpcMiddleware<JsonRpcParams, Json>;
export {};
