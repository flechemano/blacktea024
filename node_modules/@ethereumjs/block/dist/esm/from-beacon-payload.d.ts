import type { ExecutionPayload, VerkleExecutionWitness } from './types.js';
declare type BeaconWithdrawal = {
    index: string;
    validator_index: string;
    address: string;
    amount: string;
};
export declare type BeaconPayloadJson = {
    parent_hash: string;
    fee_recipient: string;
    state_root: string;
    receipts_root: string;
    logs_bloom: string;
    prev_randao: string;
    block_number: string;
    gas_limit: string;
    gas_used: string;
    timestamp: string;
    extra_data: string;
    base_fee_per_gas: string;
    block_hash: string;
    transactions: string[];
    withdrawals?: BeaconWithdrawal[];
    blob_gas_used?: string;
    excess_blob_gas?: string;
    parent_beacon_block_root?: string;
    execution_witness?: VerkleExecutionWitness;
};
/**
 * Converts a beacon block execution payload JSON object {@link BeaconPayloadJson} to the {@link ExecutionPayload} data needed to construct a {@link Block}.
 * The JSON data can be retrieved from a consensus layer (CL) client on this Beacon API `/eth/v2/beacon/blocks/[block number]`
 */
export declare function executionPayloadFromBeaconPayload(payload: BeaconPayloadJson): ExecutionPayload;
export {};
//# sourceMappingURL=from-beacon-payload.d.ts.map