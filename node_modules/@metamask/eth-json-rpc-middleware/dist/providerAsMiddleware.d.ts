import type { SafeEventEmitterProvider } from '@metamask/eth-json-rpc-provider';
import type { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import type { Json, JsonRpcParams } from '@metamask/utils';
export declare function providerAsMiddleware(provider: SafeEventEmitterProvider): JsonRpcMiddleware<JsonRpcParams, Json>;
export declare function ethersProviderAsMiddleware(provider: SafeEventEmitterProvider): JsonRpcMiddleware<JsonRpcParams, Json>;
