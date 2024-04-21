"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Block = void 0;
const common_1 = require("@ethereumjs/common");
const rlp_1 = require("@ethereumjs/rlp");
const trie_1 = require("@ethereumjs/trie");
const tx_1 = require("@ethereumjs/tx");
const util_1 = require("@ethereumjs/util");
const keccak_js_1 = require("ethereum-cryptography/keccak.js");
const from_beacon_payload_js_1 = require("./from-beacon-payload.js");
const from_rpc_js_1 = require("./from-rpc.js");
const header_js_1 = require("./header.js");
/**
 * An object that represents the block.
 */
class Block {
    /**
     * This constructor takes the values, validates them, assigns them and freezes the object.
     * Use the static factory methods to assist in creating a Block object from varying data types and options.
     */
    constructor(header, transactions = [], uncleHeaders = [], withdrawals, opts = {}, executionWitness) {
        this.transactions = [];
        this.uncleHeaders = [];
        this.cache = {};
        this.header = header ?? header_js_1.BlockHeader.fromHeaderData({}, opts);
        this.common = this.header.common;
        this.keccakFunction = this.common.customCrypto.keccak256 ?? keccak_js_1.keccak256;
        this.transactions = transactions;
        this.withdrawals = withdrawals ?? (this.common.isActivatedEIP(4895) ? [] : undefined);
        this.executionWitness = executionWitness;
        // null indicates an intentional absence of value or unavailability
        // undefined indicates that the executionWitness should be initialized with the default state
        if (this.common.isActivatedEIP(6800) && this.executionWitness === undefined) {
            this.executionWitness = {
                stateDiff: [],
                verkleProof: {
                    commitmentsByPath: [],
                    d: '0x',
                    depthExtensionPresent: '0x',
                    ipaProof: {
                        cl: [],
                        cr: [],
                        finalEvaluation: '0x',
                    },
                    otherStems: [],
                },
            };
        }
        this.uncleHeaders = uncleHeaders;
        if (uncleHeaders.length > 0) {
            this.validateUncles();
            if (this.common.consensusType() === common_1.ConsensusType.ProofOfAuthority) {
                const msg = this._errorMsg('Block initialization with uncleHeaders on a PoA network is not allowed');
                throw new Error(msg);
            }
            if (this.common.consensusType() === common_1.ConsensusType.ProofOfStake) {
                const msg = this._errorMsg('Block initialization with uncleHeaders on a PoS network is not allowed');
                throw new Error(msg);
            }
        }
        if (!this.common.isActivatedEIP(4895) && withdrawals !== undefined) {
            throw new Error('Cannot have a withdrawals field if EIP 4895 is not active');
        }
        if (!this.common.isActivatedEIP(6800) &&
            executionWitness !== undefined &&
            executionWitness !== null) {
            throw new Error(`Cannot have executionWitness field if EIP 6800 is not active `);
        }
        const freeze = opts?.freeze ?? true;
        if (freeze) {
            Object.freeze(this);
        }
    }
    /**
     * Returns the withdrawals trie root for array of Withdrawal.
     * @param wts array of Withdrawal to compute the root of
     * @param optional emptyTrie to use to generate the root
     */
    static async genWithdrawalsTrieRoot(wts, emptyTrie) {
        const trie = emptyTrie ?? new trie_1.Trie();
        for (const [i, wt] of wts.entries()) {
            await trie.put(rlp_1.RLP.encode(i), rlp_1.RLP.encode(wt.raw()));
        }
        return trie.root();
    }
    /**
     * Returns the txs trie root for array of TypedTransaction
     * @param txs array of TypedTransaction to compute the root of
     * @param optional emptyTrie to use to generate the root
     */
    static async genTransactionsTrieRoot(txs, emptyTrie) {
        const trie = emptyTrie ?? new trie_1.Trie();
        for (const [i, tx] of txs.entries()) {
            await trie.put(rlp_1.RLP.encode(i), tx.serialize());
        }
        return trie.root();
    }
    /**
     * Static constructor to create a block from a block data dictionary
     *
     * @param blockData
     * @param opts
     */
    static fromBlockData(blockData = {}, opts) {
        const { header: headerData, transactions: txsData, uncleHeaders: uhsData, withdrawals: withdrawalsData, executionWitness: executionWitnessData, } = blockData;
        const header = header_js_1.BlockHeader.fromHeaderData(headerData, opts);
        // parse transactions
        const transactions = [];
        for (const txData of txsData ?? []) {
            const tx = tx_1.TransactionFactory.fromTxData(txData, {
                ...opts,
                // Use header common in case of setHardfork being activated
                common: header.common,
            });
            transactions.push(tx);
        }
        // parse uncle headers
        const uncleHeaders = [];
        const uncleOpts = {
            ...opts,
            // Use header common in case of setHardfork being activated
            common: header.common,
            // Disable this option here (all other options carried over), since this overwrites the provided Difficulty to an incorrect value
            calcDifficultyFromHeader: undefined,
        };
        // Uncles are obsolete post-merge, any hardfork by option implies setHardfork
        if (opts?.setHardfork !== undefined) {
            uncleOpts.setHardfork = true;
        }
        for (const uhData of uhsData ?? []) {
            const uh = header_js_1.BlockHeader.fromHeaderData(uhData, uncleOpts);
            uncleHeaders.push(uh);
        }
        const withdrawals = withdrawalsData?.map(util_1.Withdrawal.fromWithdrawalData);
        // The witness data is planned to come in rlp serialized bytes so leave this
        // stub till that time
        const executionWitness = executionWitnessData;
        return new Block(header, transactions, uncleHeaders, withdrawals, opts, executionWitness);
    }
    /**
     * Static constructor to create a block from a RLP-serialized block
     *
     * @param serialized
     * @param opts
     */
    static fromRLPSerializedBlock(serialized, opts) {
        const values = rlp_1.RLP.decode(Uint8Array.from(serialized));
        if (!Array.isArray(values)) {
            throw new Error('Invalid serialized block input. Must be array');
        }
        return Block.fromValuesArray(values, opts);
    }
    /**
     * Static constructor to create a block from an array of Bytes values
     *
     * @param values
     * @param opts
     */
    static fromValuesArray(values, opts) {
        if (values.length > 5) {
            throw new Error(`invalid block. More values=${values.length} than expected were received (at most 5)`);
        }
        // First try to load header so that we can use its common (in case of setHardfork being activated)
        // to correctly make checks on the hardforks
        const [headerData, txsData, uhsData, withdrawalBytes, executionWitnessBytes] = values;
        const header = header_js_1.BlockHeader.fromValuesArray(headerData, opts);
        if (header.common.isActivatedEIP(4895) &&
            (withdrawalBytes === undefined || !Array.isArray(withdrawalBytes))) {
            throw new Error('Invalid serialized block input: EIP-4895 is active, and no withdrawals were provided as array');
        }
        // parse transactions
        const transactions = [];
        for (const txData of txsData ?? []) {
            transactions.push(tx_1.TransactionFactory.fromBlockBodyData(txData, {
                ...opts,
                // Use header common in case of setHardfork being activated
                common: header.common,
            }));
        }
        // parse uncle headers
        const uncleHeaders = [];
        const uncleOpts = {
            ...opts,
            // Use header common in case of setHardfork being activated
            common: header.common,
            // Disable this option here (all other options carried over), since this overwrites the provided Difficulty to an incorrect value
            calcDifficultyFromHeader: undefined,
        };
        // Uncles are obsolete post-merge, any hardfork by option implies setHardfork
        if (opts?.setHardfork !== undefined) {
            uncleOpts.setHardfork = true;
        }
        for (const uncleHeaderData of uhsData ?? []) {
            uncleHeaders.push(header_js_1.BlockHeader.fromValuesArray(uncleHeaderData, uncleOpts));
        }
        const withdrawals = withdrawalBytes
            ?.map(([index, validatorIndex, address, amount]) => ({
            index,
            validatorIndex,
            address,
            amount,
        }))
            ?.map(util_1.Withdrawal.fromWithdrawalData);
        // executionWitness are not part of the EL fetched blocks via eth_ bodies method
        // they are currently only available via the engine api constructed blocks
        let executionWitness;
        if (header.common.isActivatedEIP(6800) && executionWitnessBytes !== undefined) {
            executionWitness = JSON.parse((0, util_1.bytesToUtf8)(rlp_1.RLP.decode(executionWitnessBytes)));
        }
        else {
            // don't assign default witness if eip 6800 is implemented as it leads to incorrect
            // assumptions while executing the block. if not present in input implies its unavailable
            executionWitness = null;
        }
        return new Block(header, transactions, uncleHeaders, withdrawals, opts, executionWitness);
    }
    /**
     * Creates a new block object from Ethereum JSON RPC.
     *
     * @param blockParams - Ethereum JSON RPC of block (eth_getBlockByNumber)
     * @param uncles - Optional list of Ethereum JSON RPC of uncles (eth_getUncleByBlockHashAndIndex)
     * @param opts - An object describing the blockchain
     */
    static fromRPC(blockData, uncles, opts) {
        return (0, from_rpc_js_1.blockFromRpc)(blockData, uncles, opts);
    }
    /**
     *  Method to retrieve a block from an execution payload
     * @param execution payload constructed from beacon payload
     * @param opts {@link BlockOptions}
     * @returns the block constructed block
     */
    static async fromExecutionPayload(payload, opts) {
        const { blockNumber: number, receiptsRoot: receiptTrie, prevRandao: mixHash, feeRecipient: coinbase, transactions, withdrawals: withdrawalsData, executionWitness, } = payload;
        const txs = [];
        for (const [index, serializedTx] of transactions.entries()) {
            try {
                const tx = tx_1.TransactionFactory.fromSerializedData((0, util_1.hexToBytes)(serializedTx), {
                    common: opts?.common,
                });
                txs.push(tx);
            }
            catch (error) {
                const validationError = `Invalid tx at index ${index}: ${error}`;
                throw validationError;
            }
        }
        const transactionsTrie = await Block.genTransactionsTrieRoot(txs, new trie_1.Trie({ common: opts?.common }));
        const withdrawals = withdrawalsData?.map((wData) => util_1.Withdrawal.fromWithdrawalData(wData));
        const withdrawalsRoot = withdrawals
            ? await Block.genWithdrawalsTrieRoot(withdrawals, new trie_1.Trie({ common: opts?.common }))
            : undefined;
        const header = {
            ...payload,
            number,
            receiptTrie,
            transactionsTrie,
            withdrawalsRoot,
            mixHash,
            coinbase,
        };
        // we are not setting setHardfork as common is already set to the correct hf
        const block = Block.fromBlockData({ header, transactions: txs, withdrawals, executionWitness }, opts);
        if (block.common.isActivatedEIP(6800) &&
            (executionWitness === undefined || executionWitness === null)) {
            throw Error('Missing executionWitness for EIP-6800 activated executionPayload');
        }
        // Verify blockHash matches payload
        if (!(0, util_1.equalsBytes)(block.hash(), (0, util_1.hexToBytes)(payload.blockHash))) {
            const validationError = `Invalid blockHash, expected: ${payload.blockHash}, received: ${(0, util_1.bytesToHex)(block.hash())}`;
            throw Error(validationError);
        }
        return block;
    }
    /**
     *  Method to retrieve a block from a beacon payload json
     * @param payload json of a beacon beacon fetched from beacon apis
     * @param opts {@link BlockOptions}
     * @returns the block constructed block
     */
    static async fromBeaconPayloadJson(payload, opts) {
        const executionPayload = (0, from_beacon_payload_js_1.executionPayloadFromBeaconPayload)(payload);
        return Block.fromExecutionPayload(executionPayload, opts);
    }
    /**
     * Returns a Array of the raw Bytes Arrays of this block, in order.
     */
    raw() {
        const bytesArray = [
            this.header.raw(),
            this.transactions.map((tx) => tx.supports(tx_1.Capability.EIP2718TypedTransaction) ? tx.serialize() : tx.raw()),
            this.uncleHeaders.map((uh) => uh.raw()),
        ];
        const withdrawalsRaw = this.withdrawals?.map((wt) => wt.raw());
        if (withdrawalsRaw) {
            bytesArray.push(withdrawalsRaw);
        }
        if (this.executionWitness !== undefined && this.executionWitness !== null) {
            const executionWitnessBytes = rlp_1.RLP.encode(JSON.stringify(this.executionWitness));
            bytesArray.push(executionWitnessBytes);
        }
        return bytesArray;
    }
    /**
     * Returns the hash of the block.
     */
    hash() {
        return this.header.hash();
    }
    /**
     * Determines if this block is the genesis block.
     */
    isGenesis() {
        return this.header.isGenesis();
    }
    /**
     * Returns the rlp encoding of the block.
     */
    serialize() {
        return rlp_1.RLP.encode(this.raw());
    }
    /**
     * Generates transaction trie for validation.
     */
    async genTxTrie() {
        return Block.genTransactionsTrieRoot(this.transactions, new trie_1.Trie({ common: this.common }));
    }
    /**
     * Validates the transaction trie by generating a trie
     * and do a check on the root hash.
     * @returns True if the transaction trie is valid, false otherwise
     */
    async transactionsTrieIsValid() {
        let result;
        if (this.transactions.length === 0) {
            result = (0, util_1.equalsBytes)(this.header.transactionsTrie, util_1.KECCAK256_RLP);
            return result;
        }
        if (this.cache.txTrieRoot === undefined) {
            this.cache.txTrieRoot = await this.genTxTrie();
        }
        result = (0, util_1.equalsBytes)(this.cache.txTrieRoot, this.header.transactionsTrie);
        return result;
    }
    /**
     * Validates transaction signatures and minimum gas requirements.
     * @returns {string[]} an array of error strings
     */
    getTransactionsValidationErrors() {
        const errors = [];
        let blobGasUsed = util_1.BIGINT_0;
        const blobGasLimit = this.common.param('gasConfig', 'maxblobGasPerBlock');
        const blobGasPerBlob = this.common.param('gasConfig', 'blobGasPerBlob');
        // eslint-disable-next-line prefer-const
        for (let [i, tx] of this.transactions.entries()) {
            const errs = tx.getValidationErrors();
            if (this.common.isActivatedEIP(1559) === true) {
                if (tx.supports(tx_1.Capability.EIP1559FeeMarket)) {
                    tx = tx;
                    if (tx.maxFeePerGas < this.header.baseFeePerGas) {
                        errs.push('tx unable to pay base fee (EIP-1559 tx)');
                    }
                }
                else {
                    tx = tx;
                    if (tx.gasPrice < this.header.baseFeePerGas) {
                        errs.push('tx unable to pay base fee (non EIP-1559 tx)');
                    }
                }
            }
            if (this.common.isActivatedEIP(4844) === true) {
                if (tx instanceof tx_1.BlobEIP4844Transaction) {
                    blobGasUsed += BigInt(tx.numBlobs()) * blobGasPerBlob;
                    if (blobGasUsed > blobGasLimit) {
                        errs.push(`tx causes total blob gas of ${blobGasUsed} to exceed maximum blob gas per block of ${blobGasLimit}`);
                    }
                }
            }
            if (errs.length > 0) {
                errors.push(`errors at tx ${i}: ${errs.join(', ')}`);
            }
        }
        if (this.common.isActivatedEIP(4844) === true) {
            if (blobGasUsed !== this.header.blobGasUsed) {
                errors.push(`invalid blobGasUsed expected=${this.header.blobGasUsed} actual=${blobGasUsed}`);
            }
        }
        return errors;
    }
    /**
     * Validates transaction signatures and minimum gas requirements.
     * @returns True if all transactions are valid, false otherwise
     */
    transactionsAreValid() {
        const errors = this.getTransactionsValidationErrors();
        return errors.length === 0;
    }
    /**
     * Validates the block data, throwing if invalid.
     * This can be checked on the Block itself without needing access to any parent block
     * It checks:
     * - All transactions are valid
     * - The transactions trie is valid
     * - The uncle hash is valid
     * @param onlyHeader if only passed the header, skip validating txTrie and unclesHash (default: false)
     * @param verifyTxs if set to `false`, will not check for transaction validation errors (default: true)
     */
    async validateData(onlyHeader = false, verifyTxs = true) {
        if (verifyTxs) {
            const txErrors = this.getTransactionsValidationErrors();
            if (txErrors.length > 0) {
                const msg = this._errorMsg(`invalid transactions: ${txErrors.join(' ')}`);
                throw new Error(msg);
            }
        }
        if (onlyHeader) {
            return;
        }
        if (verifyTxs) {
            for (const [index, tx] of this.transactions.entries()) {
                if (!tx.isSigned()) {
                    const msg = this._errorMsg(`invalid transactions: transaction at index ${index} is unsigned`);
                    throw new Error(msg);
                }
            }
        }
        if (!(await this.transactionsTrieIsValid())) {
            const msg = this._errorMsg('invalid transaction trie');
            throw new Error(msg);
        }
        if (!this.uncleHashIsValid()) {
            const msg = this._errorMsg('invalid uncle hash');
            throw new Error(msg);
        }
        if (this.common.isActivatedEIP(4895) && !(await this.withdrawalsTrieIsValid())) {
            const msg = this._errorMsg('invalid withdrawals trie');
            throw new Error(msg);
        }
        // Validation for Verkle blocks
        // Unnecessary in this implementation since we're providing defaults if those fields are undefined
        if (this.common.isActivatedEIP(6800)) {
            if (this.executionWitness === undefined) {
                throw new Error(`Invalid block: missing executionWitness`);
            }
            if (this.executionWitness === null) {
                throw new Error(`Invalid block: ethereumjs stateless client needs executionWitness`);
            }
        }
    }
    /**
     * Validates that blob gas fee for each transaction is greater than or equal to the
     * blobGasPrice for the block and that total blob gas in block is less than maximum
     * blob gas per block
     * @param parentHeader header of parent block
     */
    validateBlobTransactions(parentHeader) {
        if (this.common.isActivatedEIP(4844)) {
            const blobGasLimit = this.common.param('gasConfig', 'maxblobGasPerBlock');
            const blobGasPerBlob = this.common.param('gasConfig', 'blobGasPerBlob');
            let blobGasUsed = util_1.BIGINT_0;
            const expectedExcessBlobGas = parentHeader.calcNextExcessBlobGas();
            if (this.header.excessBlobGas !== expectedExcessBlobGas) {
                throw new Error(`block excessBlobGas mismatch: have ${this.header.excessBlobGas}, want ${expectedExcessBlobGas}`);
            }
            let blobGasPrice;
            for (const tx of this.transactions) {
                if (tx instanceof tx_1.BlobEIP4844Transaction) {
                    blobGasPrice = blobGasPrice ?? this.header.getBlobGasPrice();
                    if (tx.maxFeePerBlobGas < blobGasPrice) {
                        throw new Error(`blob transaction maxFeePerBlobGas ${tx.maxFeePerBlobGas} < than block blob gas price ${blobGasPrice} - ${this.errorStr()}`);
                    }
                    blobGasUsed += BigInt(tx.blobVersionedHashes.length) * blobGasPerBlob;
                    if (blobGasUsed > blobGasLimit) {
                        throw new Error(`tx causes total blob gas of ${blobGasUsed} to exceed maximum blob gas per block of ${blobGasLimit}`);
                    }
                }
            }
            if (this.header.blobGasUsed !== blobGasUsed) {
                throw new Error(`block blobGasUsed mismatch: have ${this.header.blobGasUsed}, want ${blobGasUsed}`);
            }
        }
    }
    /**
     * Validates the uncle's hash.
     * @returns true if the uncle's hash is valid, false otherwise.
     */
    uncleHashIsValid() {
        const uncles = this.uncleHeaders.map((uh) => uh.raw());
        const raw = rlp_1.RLP.encode(uncles);
        return (0, util_1.equalsBytes)(this.keccakFunction(raw), this.header.uncleHash);
    }
    /**
     * Validates the withdrawal root
     * @returns true if the withdrawals trie root is valid, false otherwise
     */
    async withdrawalsTrieIsValid() {
        if (!this.common.isActivatedEIP(4895)) {
            throw new Error('EIP 4895 is not activated');
        }
        const withdrawalsRoot = await Block.genWithdrawalsTrieRoot(this.withdrawals, new trie_1.Trie({ common: this.common }));
        return (0, util_1.equalsBytes)(withdrawalsRoot, this.header.withdrawalsRoot);
    }
    /**
     * Consistency checks for uncles included in the block, if any.
     *
     * Throws if invalid.
     *
     * The rules for uncles checked are the following:
     * Header has at most 2 uncles.
     * Header does not count an uncle twice.
     */
    validateUncles() {
        if (this.isGenesis()) {
            return;
        }
        // Header has at most 2 uncles
        if (this.uncleHeaders.length > 2) {
            const msg = this._errorMsg('too many uncle headers');
            throw new Error(msg);
        }
        // Header does not count an uncle twice.
        const uncleHashes = this.uncleHeaders.map((header) => (0, util_1.bytesToHex)(header.hash()));
        if (!(new Set(uncleHashes).size === uncleHashes.length)) {
            const msg = this._errorMsg('duplicate uncles');
            throw new Error(msg);
        }
    }
    /**
     * Returns the canonical difficulty for this block.
     *
     * @param parentBlock - the parent of this `Block`
     */
    ethashCanonicalDifficulty(parentBlock) {
        return this.header.ethashCanonicalDifficulty(parentBlock.header);
    }
    /**
     * Validates if the block gasLimit remains in the boundaries set by the protocol.
     * Throws if invalid
     *
     * @param parentBlock - the parent of this `Block`
     */
    validateGasLimit(parentBlock) {
        return this.header.validateGasLimit(parentBlock.header);
    }
    /**
     * Returns the block in JSON format.
     */
    toJSON() {
        const withdrawalsAttr = this.withdrawals
            ? {
                withdrawals: this.withdrawals.map((wt) => wt.toJSON()),
            }
            : {};
        return {
            header: this.header.toJSON(),
            transactions: this.transactions.map((tx) => tx.toJSON()),
            uncleHeaders: this.uncleHeaders.map((uh) => uh.toJSON()),
            ...withdrawalsAttr,
        };
    }
    /**
     * Return a compact error string representation of the object
     */
    errorStr() {
        let hash = '';
        try {
            hash = (0, util_1.bytesToHex)(this.hash());
        }
        catch (e) {
            hash = 'error';
        }
        let hf = '';
        try {
            hf = this.common.hardfork();
        }
        catch (e) {
            hf = 'error';
        }
        let errorStr = `block number=${this.header.number} hash=${hash} `;
        errorStr += `hf=${hf} baseFeePerGas=${this.header.baseFeePerGas ?? 'none'} `;
        errorStr += `txs=${this.transactions.length} uncles=${this.uncleHeaders.length}`;
        return errorStr;
    }
    /**
     * Internal helper function to create an annotated error message
     *
     * @param msg Base error message
     * @hidden
     */
    _errorMsg(msg) {
        return `${msg} (${this.errorStr()})`;
    }
}
exports.Block = Block;
_a = Block;
/**
 *  Method to retrieve a block from a JSON-RPC provider and format as a {@link Block}
 * @param provider either a url for a remote provider or an Ethers JsonRpcProvider object
 * @param blockTag block hash or block number to be run
 * @param opts {@link BlockOptions}
 * @returns the block specified by `blockTag`
 */
Block.fromJsonRpcProvider = async (provider, blockTag, opts) => {
    let blockData;
    const providerUrl = (0, util_1.getProvider)(provider);
    if (typeof blockTag === 'string' && blockTag.length === 66) {
        blockData = await (0, util_1.fetchFromProvider)(providerUrl, {
            method: 'eth_getBlockByHash',
            params: [blockTag, true],
        });
    }
    else if (typeof blockTag === 'bigint') {
        blockData = await (0, util_1.fetchFromProvider)(providerUrl, {
            method: 'eth_getBlockByNumber',
            params: [(0, util_1.bigIntToHex)(blockTag), true],
        });
    }
    else if ((0, util_1.isHexPrefixed)(blockTag) ||
        blockTag === 'latest' ||
        blockTag === 'earliest' ||
        blockTag === 'pending' ||
        blockTag === 'finalized' ||
        blockTag === 'safe') {
        blockData = await (0, util_1.fetchFromProvider)(providerUrl, {
            method: 'eth_getBlockByNumber',
            params: [blockTag, true],
        });
    }
    else {
        throw new Error(`expected blockTag to be block hash, bigint, hex prefixed string, or earliest/latest/pending; got ${blockTag}`);
    }
    if (blockData === null) {
        throw new Error('No block data returned from provider');
    }
    const uncleHeaders = [];
    if (blockData.uncles.length > 0) {
        for (let x = 0; x < blockData.uncles.length; x++) {
            const headerData = await (0, util_1.fetchFromProvider)(providerUrl, {
                method: 'eth_getUncleByBlockHashAndIndex',
                params: [blockData.hash, (0, util_1.intToHex)(x)],
            });
            uncleHeaders.push(headerData);
        }
    }
    return (0, from_rpc_js_1.blockFromRpc)(blockData, uncleHeaders, opts);
};
//# sourceMappingURL=block.js.map