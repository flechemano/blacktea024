import type { JsonRpcParams } from '@metamask/utils';
import type { ExtendedJsonRpcRequest, RequestHeaders, InfuraJsonRpcSupportedNetwork } from './types';
declare type FetchConfig = {
    fetchUrl: string;
    fetchParams: {
        method: string;
        headers: RequestHeaders;
        body: string;
    };
};
/**
 * Determines the arguments to feed into `fetch` in order to make a request to
 * Infura.
 * @param options - The options.
 * @param options.network - A network that Infura supports; plugs into
 * `https://${network}.infura.io`.
 * @param options.projectId - The Infura project id.
 * @param options.extraHeaders - Extra headers that will be used to make the
 * request.
 * @param options.req - The original request object obtained via the
 * middleware stack.
 * @param options.source - A descriptor for the entity making the request;
 * tracked by Infura for analytics purposes.
 * @returns An object containing the URL and a bag of options, both of which
 * will be passed to `fetch`.
 */
export declare function fetchConfigFromReq({ network, projectId, extraHeaders, req, source, }: {
    network: InfuraJsonRpcSupportedNetwork;
    projectId: string;
    extraHeaders?: RequestHeaders;
    req: ExtendedJsonRpcRequest<JsonRpcParams>;
    source?: string;
}): FetchConfig;
export {};
