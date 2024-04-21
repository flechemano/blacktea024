import type { JsonRpcError } from '@metamask/utils';
export declare function isExecutionRevertedError(error: unknown): error is JsonRpcError;
