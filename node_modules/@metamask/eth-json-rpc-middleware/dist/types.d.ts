import type { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import type { Json, JsonRpcParams, JsonRpcRequest } from '@metamask/utils';
export interface JsonRpcRequestToCache<Params extends JsonRpcParams> extends JsonRpcRequest<Params> {
    skipCache?: boolean;
}
export declare type JsonRpcCacheMiddleware<Params extends JsonRpcParams, Result extends Json> = JsonRpcMiddleware<Params, Result> extends (req: JsonRpcRequest<Params>, ...args: infer X) => infer Y ? (req: JsonRpcRequestToCache<Params>, ...args: X) => Y : never;
export declare type BlockData = string | string[];
export declare type Block = Record<string, BlockData>;
export declare type BlockCache = Record<string, Block>;
export declare type Cache = Record<number, BlockCache>;
