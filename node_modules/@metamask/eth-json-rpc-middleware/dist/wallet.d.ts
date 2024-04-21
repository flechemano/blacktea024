import type { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import type { JsonRpcRequest } from '@metamask/utils';
import type { Block } from './types';
export declare type TransactionParams = {
    from: string;
};
export declare type MessageParams = TransactionParams & {
    data: string;
    signatureMethod?: string;
};
export declare type TypedMessageParams = MessageParams & {
    version: string;
};
export declare type TypedMessageV1Params = Omit<TypedMessageParams, 'data'> & {
    data: Record<string, unknown>[];
};
export interface WalletMiddlewareOptions {
    getAccounts: (req: JsonRpcRequest) => Promise<string[]>;
    processDecryptMessage?: (msgParams: MessageParams, req: JsonRpcRequest) => Promise<string>;
    processEncryptionPublicKey?: (address: string, req: JsonRpcRequest) => Promise<string>;
    processEthSignMessage?: (msgParams: MessageParams, req: JsonRpcRequest) => Promise<string>;
    processPersonalMessage?: (msgParams: MessageParams, req: JsonRpcRequest) => Promise<string>;
    processTransaction?: (txParams: TransactionParams, req: JsonRpcRequest) => Promise<string>;
    processSignTransaction?: (txParams: TransactionParams, req: JsonRpcRequest) => Promise<string>;
    processTypedMessage?: (msgParams: TypedMessageV1Params, req: JsonRpcRequest, version: string) => Promise<string>;
    processTypedMessageV3?: (msgParams: TypedMessageParams, req: JsonRpcRequest, version: string) => Promise<string>;
    processTypedMessageV4?: (msgParams: TypedMessageParams, req: JsonRpcRequest, version: string) => Promise<string>;
}
export declare function createWalletMiddleware({ getAccounts, processDecryptMessage, processEncryptionPublicKey, processEthSignMessage, processPersonalMessage, processTransaction, processSignTransaction, processTypedMessage, processTypedMessageV3, processTypedMessageV4, }: WalletMiddlewareOptions): JsonRpcMiddleware<any, Block>;
