import { RdfWriteApiClientType } from "./rdfWriteApiClientFactory";

export type DispatchResult = ReturnType<RdfWriteApiClientType["POST"]>;

export type Endpoints = Parameters<RdfWriteApiClientType["POST"]>[0];

