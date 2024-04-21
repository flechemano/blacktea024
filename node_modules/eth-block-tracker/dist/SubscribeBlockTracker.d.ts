import type { SafeEventEmitterProvider } from '@metamask/eth-json-rpc-provider';
import SafeEventEmitter from '@metamask/safe-event-emitter';
import type { BlockTracker } from './BlockTracker';
export interface SubscribeBlockTrackerOptions {
    provider?: SafeEventEmitterProvider;
    blockResetDuration?: number;
    usePastBlocks?: boolean;
}
export declare class SubscribeBlockTracker extends SafeEventEmitter implements BlockTracker {
    private _isRunning;
    private readonly _blockResetDuration;
    private readonly _usePastBlocks;
    private _currentBlock;
    private _blockResetTimeout?;
    private readonly _provider;
    private _subscriptionId;
    constructor(opts?: SubscribeBlockTrackerOptions);
    destroy(): Promise<void>;
    isRunning(): boolean;
    getCurrentBlock(): string | null;
    getLatestBlock(): Promise<string>;
    removeAllListeners(eventName?: string | symbol): this;
    private _setupInternalEvents;
    private _onNewListener;
    private _onRemoveListener;
    private _maybeStart;
    private _maybeEnd;
    private _getBlockTrackerEventCount;
    private _shouldUseNewBlock;
    private _newPotentialLatest;
    private _setCurrentBlock;
    private _setupBlockResetTimeout;
    private _cancelBlockResetTimeout;
    private _resetCurrentBlock;
    checkForLatestBlock(): Promise<string>;
    private _start;
    private _end;
    private _call;
    private _handleSubData;
}
