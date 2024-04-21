"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollingBlockTracker = void 0;
const safe_event_emitter_1 = __importDefault(require("@metamask/safe-event-emitter"));
const json_rpc_random_id_1 = __importDefault(require("json-rpc-random-id"));
const pify_1 = __importDefault(require("pify"));
const logging_utils_1 = require("./logging-utils");
const log = (0, logging_utils_1.createModuleLogger)(logging_utils_1.projectLogger, 'polling-block-tracker');
const createRandomId = (0, json_rpc_random_id_1.default)();
const sec = 1000;
const calculateSum = (accumulator, currentValue) => accumulator + currentValue;
const blockTrackerEvents = ['sync', 'latest'];
class PollingBlockTracker extends safe_event_emitter_1.default {
    constructor(opts = {}) {
        // parse + validate args
        if (!opts.provider) {
            throw new Error('PollingBlockTracker - no provider specified.');
        }
        super();
        // config
        this._blockResetDuration = opts.blockResetDuration || 20 * sec;
        this._usePastBlocks = opts.usePastBlocks || false;
        // state
        this._currentBlock = null;
        this._isRunning = false;
        // bind functions for internal use
        this._onNewListener = this._onNewListener.bind(this);
        this._onRemoveListener = this._onRemoveListener.bind(this);
        this._resetCurrentBlock = this._resetCurrentBlock.bind(this);
        // listen for handler changes
        this._setupInternalEvents();
        // config
        this._provider = opts.provider;
        this._pollingInterval = opts.pollingInterval || 20 * sec;
        this._retryTimeout = opts.retryTimeout || this._pollingInterval / 10;
        this._keepEventLoopActive =
            opts.keepEventLoopActive === undefined ? true : opts.keepEventLoopActive;
        this._setSkipCacheFlag = opts.setSkipCacheFlag || false;
    }
    async destroy() {
        this._cancelBlockResetTimeout();
        await this._maybeEnd();
        super.removeAllListeners();
    }
    isRunning() {
        return this._isRunning;
    }
    getCurrentBlock() {
        return this._currentBlock;
    }
    async getLatestBlock() {
        // return if available
        if (this._currentBlock) {
            return this._currentBlock;
        }
        // wait for a new latest block
        const latestBlock = await new Promise((resolve) => this.once('latest', resolve));
        // return newly set current block
        return latestBlock;
    }
    // dont allow module consumer to remove our internal event listeners
    removeAllListeners(eventName) {
        // perform default behavior, preserve fn arity
        if (eventName) {
            super.removeAllListeners(eventName);
        }
        else {
            super.removeAllListeners();
        }
        // re-add internal events
        this._setupInternalEvents();
        // trigger stop check just in case
        this._onRemoveListener();
        return this;
    }
    _setupInternalEvents() {
        // first remove listeners for idempotence
        this.removeListener('newListener', this._onNewListener);
        this.removeListener('removeListener', this._onRemoveListener);
        // then add them
        this.on('newListener', this._onNewListener);
        this.on('removeListener', this._onRemoveListener);
    }
    _onNewListener(eventName) {
        // `newListener` is called *before* the listener is added
        if (blockTrackerEvents.includes(eventName)) {
            // TODO: Handle dangling promise
            this._maybeStart();
        }
    }
    _onRemoveListener() {
        // `removeListener` is called *after* the listener is removed
        if (this._getBlockTrackerEventCount() > 0) {
            return;
        }
        this._maybeEnd();
    }
    async _maybeStart() {
        if (this._isRunning) {
            return;
        }
        this._isRunning = true;
        // cancel setting latest block to stale
        this._cancelBlockResetTimeout();
        await this._start();
        this.emit('_started');
    }
    async _maybeEnd() {
        if (!this._isRunning) {
            return;
        }
        this._isRunning = false;
        this._setupBlockResetTimeout();
        await this._end();
        this.emit('_ended');
    }
    _getBlockTrackerEventCount() {
        return blockTrackerEvents
            .map((eventName) => this.listenerCount(eventName))
            .reduce(calculateSum);
    }
    _shouldUseNewBlock(newBlock) {
        const currentBlock = this._currentBlock;
        if (!currentBlock) {
            return true;
        }
        const newBlockInt = hexToInt(newBlock);
        const currentBlockInt = hexToInt(currentBlock);
        return ((this._usePastBlocks && newBlockInt < currentBlockInt) ||
            newBlockInt > currentBlockInt);
    }
    _newPotentialLatest(newBlock) {
        if (!this._shouldUseNewBlock(newBlock)) {
            return;
        }
        this._setCurrentBlock(newBlock);
    }
    _setCurrentBlock(newBlock) {
        const oldBlock = this._currentBlock;
        this._currentBlock = newBlock;
        this.emit('latest', newBlock);
        this.emit('sync', { oldBlock, newBlock });
    }
    _setupBlockResetTimeout() {
        // clear any existing timeout
        this._cancelBlockResetTimeout();
        // clear latest block when stale
        this._blockResetTimeout = setTimeout(this._resetCurrentBlock, this._blockResetDuration);
        // nodejs - dont hold process open
        if (this._blockResetTimeout.unref) {
            this._blockResetTimeout.unref();
        }
    }
    _cancelBlockResetTimeout() {
        if (this._blockResetTimeout) {
            clearTimeout(this._blockResetTimeout);
        }
    }
    _resetCurrentBlock() {
        this._currentBlock = null;
    }
    // trigger block polling
    async checkForLatestBlock() {
        await this._updateLatestBlock();
        return await this.getLatestBlock();
    }
    async _start() {
        this._synchronize();
    }
    async _end() {
        // No-op
    }
    async _synchronize() {
        var _a;
        while (this._isRunning) {
            try {
                await this._updateLatestBlock();
                const promise = timeout(this._pollingInterval, !this._keepEventLoopActive);
                this.emit('_waitingForNextIteration');
                await promise;
            }
            catch (err) {
                const newErr = new Error(`PollingBlockTracker - encountered an error while attempting to update latest block:\n${(_a = err.stack) !== null && _a !== void 0 ? _a : err}`);
                try {
                    this.emit('error', newErr);
                }
                catch (emitErr) {
                    console.error(newErr);
                }
                const promise = timeout(this._retryTimeout, !this._keepEventLoopActive);
                this.emit('_waitingForNextIteration');
                await promise;
            }
        }
    }
    async _updateLatestBlock() {
        // fetch + set latest block
        const latestBlock = await this._fetchLatestBlock();
        this._newPotentialLatest(latestBlock);
    }
    async _fetchLatestBlock() {
        const req = {
            jsonrpc: '2.0',
            id: createRandomId(),
            method: 'eth_blockNumber',
            params: [],
        };
        if (this._setSkipCacheFlag) {
            req.skipCache = true;
        }
        log('Making request', req);
        const res = await (0, pify_1.default)((cb) => this._provider.sendAsync(req, cb))();
        log('Got response', res);
        if (res.error) {
            throw new Error(`PollingBlockTracker - encountered error fetching block:\n${res.error.message}`);
        }
        return res.result;
    }
}
exports.PollingBlockTracker = PollingBlockTracker;
/**
 * Waits for the specified amount of time.
 *
 * @param duration - The amount of time in milliseconds.
 * @param unref - Assuming this function is run in a Node context, governs
 * whether Node should wait before the `setTimeout` has completed before ending
 * the process (true for no, false for yes). Defaults to false.
 * @returns A promise that can be used to wait.
 */
async function timeout(duration, unref) {
    return new Promise((resolve) => {
        const timeoutRef = setTimeout(resolve, duration);
        // don't keep process open
        if (timeoutRef.unref && unref) {
            timeoutRef.unref();
        }
    });
}
/**
 * Converts a number represented as a string in hexadecimal format into a native
 * number.
 *
 * @param hexInt - The hex string.
 * @returns The number.
 */
function hexToInt(hexInt) {
    return Number.parseInt(hexInt, 16);
}
//# sourceMappingURL=PollingBlockTracker.js.map