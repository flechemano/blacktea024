import type { JsonRpcParams, Json } from '@metamask/utils';
import type { JsonRpcCacheMiddleware } from './types';
export declare function createInflightCacheMiddleware(): JsonRpcCacheMiddleware<JsonRpcParams, Json>;
