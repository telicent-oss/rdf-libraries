import { RdfWriteApiClientType } from "./rdfWriteApiClientFactory";

export type DispatchResult = ReturnType<RdfWriteApiClientType["POST"]>;

export type Endpoints = Parameters<RdfWriteApiClientType["POST"]>[0];


export type PredicateFnOptionsBase = { 
    dataset_uri:string, 
    vocab: {
      mint_base: string;
      PROV_PREFIX: string;
      XSD_DATETIME: string;
    }
}