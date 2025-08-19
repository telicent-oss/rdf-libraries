import { RdfWriteApiClientType } from "./rdfWriteApiClientFactory";

export type DispatchResult = ReturnType<RdfWriteApiClientType["POST"]>;

export type Endpoints = Parameters<RdfWriteApiClientType["POST"]>[0];

type OmitEndpoints =
  | "/dcterms/publisher"
  | "/dcterms/publisher/delete"
  | "/dcterms/title"
  | "/dcterms/title/delete"
  | "/dcterms/description"
  | "/dcterms/description/delete"
  | "/prov/qualified-attribution"
  | "/prov/qualified-attribution/delete"
  | "/dcterms/identifier"
  | "/dcterms/identifier/delete"
  | "/dcterms/modified"
  | "/dcterms/modified/delete"
  | "/dcterms/issued"
  | "/dcterms/issued/delete"
  | "/dcterms/rights"
  | "/dcterms/rights/delete"
  | "/dcat/contact-point"
  | "/dcat/contact-point/delete"
  | "/dcat/media-type"
  | "/dcat/media-type/delete"
  | "/document-link"
  | "/document-link/delete"
  | "/telicent/primary-name"
  | "/telicent/primary-name/delete"
  | "/ontology/rdfs-class"
  | "/annotation"
  | "/annotation/delete"
  | "/object-property"
  | "/object-property/delete";

type RequiredEndpoints = Exclude<Endpoints, OmitEndpoints>;

const predicatesToEndpoints = {
  "dct:publisher": "/dcterms/publisher/update",
  "dct:title": "/dcterms/title/update",
  "dct:description": "/dcterms/description/update",
  "dct:issued": "/dcterms/issued/update",
  "dct:rights": "/dcterms/rights/update",
  "dcat:contactPoint": "/dcat/contact-point/update",
  "dcat:mediaType": "/dcat/media-type/update",
  "prov:qualifiedAttribution": "/prov/qualified-attribution/update",
  "dct:identifier": "/dcterms/identifier/update",
  "dct:modified": "/dcterms/modified/update",
} as const satisfies Record<string, RequiredEndpoints>;

// Use TS to do exhastive check of predicatesToEndpoints;
type Values<T> = T[keyof T];
type Missing = Exclude<RequiredEndpoints, Values<typeof predicatesToEndpoints>>;
type AssertNever<T extends never> = T;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _check = AssertNever<Missing>;

export type Triple = {
  s: string;
  p: keyof typeof predicatesToEndpoints;
  o: string;
};

export type RdfWriteApiByPredicateFn = Record<
  keyof typeof predicatesToEndpoints,
  (options: { triple: Triple; prev: string | null }) => DispatchResult
>;

export const updateByPredicateFnFactory = ({
  client,
}: {
  client: RdfWriteApiClientType;
}): RdfWriteApiByPredicateFn => ({
  "dct:publisher": ({ triple, prev }) =>
    client.POST("/dcterms/publisher/update", {
      body: {
        item_uri: triple.s,
        old_publisher_object_uri: prev as unknown as string,
        new_publisher_object_uri: triple.o,
      },
    }),
  "dct:title": ({ triple, prev }) =>
    client.POST("/dcterms/title/update", {
      body: {
        item_uri: triple.s,
        old_title: prev as unknown as string,
        new_title: triple.o,
      },
    }),

  "dct:description": ({ triple, prev }) =>
    client.POST("/dcterms/description/update", {
      body: {
        item_uri: triple.s,
        old_description: prev as unknown as string,
        new_description: triple.o,
      },
    }),

  "dct:issued": ({ triple, prev }) =>
    client.POST("/dcterms/issued/update", {
      body: {
        item_uri: triple.s,
        old_datetime: prev as unknown as string,
        new_datetime: triple.o,
      },
    }),

  "dct:rights": ({ triple, prev }) =>
    client.POST("/dcterms/rights/update", {
      body: {
        item_uri: triple.s,
        old_rights_object_uri: prev as unknown as string,
        new_rights_object_uri: triple.o,
      },
    }),

  "prov:qualifiedAttribution": ({ triple, prev }) =>
    client.POST("/prov/qualified-attribution/update", {
      body: {
        item_uri: triple.s,
        old_attribution_item_uri: prev as unknown as string,
        new_attribution_item_uri: triple.o,
      },
    }),

  "dct:identifier": ({ triple, prev }) =>
    client.POST("/dcterms/identifier/update", {
      body: {
        item_uri: triple.s,
        old_identifier: prev as unknown as string,
        new_identifier: triple.o,
      },
    }),

  "dcat:contactPoint": ({ triple, prev }) =>
    client.POST("/dcat/contact-point/update", {
      body: {
        item_uri: triple.s,
        old_rights_object_uri: prev as unknown as string,
        new_rights_object_uri: triple.o,
      },
    }),
  "dcat:mediaType": ({ triple, prev }) =>
    client.POST("/dcat/media-type/update", {
      body: {
        item_uri: triple.s,
        old_media_type_object_uri: prev as unknown as string,
        new_media_type_object_uri: triple.o,
      },
    }),

  "dct:modified": ({ triple, prev }) =>
    client.POST("/dcterms/modified/update", {
      body: {
        item_uri: triple.s,
        old_datetime: prev as unknown as string,
        new_datetime: triple.o,
      },
    }),
});
