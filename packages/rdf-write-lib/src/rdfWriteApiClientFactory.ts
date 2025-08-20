import createClient, { type ClientOptions, Client } from "openapi-fetch";
import { paths } from "./open-api/paperback-writer";

export { type ClientOptions } from "openapi-fetch";
            
export type RdfWriteApiClientType = Client<paths, `${string}/${string}`>;

export const rdfWriteApiClientFactory = (clientOptions?: ClientOptions) =>
  createClient<paths>(clientOptions);
