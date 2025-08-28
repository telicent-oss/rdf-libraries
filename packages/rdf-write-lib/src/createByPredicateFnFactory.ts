import { RdfWriteApiClientType } from "./rdfWriteApiClientFactory";
import { DispatchResult, Endpoints } from "./types";
import { throwIfHTTPError } from "./utils/throwIfHTTPError";


type OmitEndpoints =
  | "/dcterms/title/delete"
  | "/dcterms/publisher/delete"
  | "/dcterms/description/delete"
  | "/prov/qualified-attribution/delete"
  | "/dcterms/identifier/delete"
  | "/dcterms/modified/delete"
  | "/dcterms/issued/delete"
  | "/dcterms/rights/delete"
  | "/dcat/contact-point/delete"
  | "/dcat/media-type/delete"
  | "/document-link/delete"
  | "/telicent/primary-name/delete"
  | "/annotation/delete"
  | "/object-property/delete"
  | "/prov/qualifiedAttribution/delete"
  | "/prov/agent/delete"
  | "/dcterms/contributor/delete"
  | "/dcat/contactPoint/delete"
  | "/dcat/mediaType/delete"
  | "/dcat/distribution/delete"
  | "/dcat/hadRole/delete"
  | "/dcat/accessURL/delete"
  | "/vcard/fn/delete"
  | "/dcterms/publisher/update"
  | "/dcterms/title/update"
  | "/dcterms/description/update"
  | "/prov/qualified-attribution/update"
  | "/dcterms/identifier/update"
  | "/dcterms/modified/update"
  | "/dcterms/issued/update"
  | "/dcterms/rights/update"
  | "/dcat/contact-point/update"
  | "/dcat/media-type/update"
  | "/document-link/update"
  | "/telicent/primary-name/update"
  | "/ontology/rdfs-class/update"
  | "/annotation/update"
  | "/object-property/update"
  | "/prov/qualifiedAttribution/update"
  | "/prov/agent/update"
  | "/dcterms/contributor/update"
  | "/dcat/contactPoint/update"
  | "/dcat/mediaType/update"
  | "/dcat/distribution/update"
  | "/dcat/hadRole/update"
  | "/dcat/accessURL/update"
  | "/vcard/fn/update"
  | "/document-link"
  | "/telicent/primary-name"
  | "/ontology/rdfs-class"
  | "/annotation";
type RequiredEndpoints = Exclude<Endpoints, OmitEndpoints>;

const predicatesToEndpoints = {
  "dcat:distribution": "/dcat/distribution",
  "dcat:hadRole": "/dcat/hadRole",
  "dcat:accessURL": "/dcat/accessURL",
  "dcterms:contributor": "/dcterms/contributor",
  "vcard:fn": "/vcard/fn",
  "dct:publisher": "/dcterms/publisher",
  "dct:title": "/dcterms/title",
  "dct:description": "/dcterms/description",
  "dct:issued": "/dcterms/issued",
  "dct:rights": "/dcterms/rights",
  "dcat:contactPoint": "/dcat/contactPoint",
  "dcat:mediaType": "/dcat/mediaType",
  "prov:qualifiedAttribution": "/prov/qualifiedAttribution",
  "prov:agent": "/prov/agent",
  "dct:identifier": "/dcterms/identifier",
  "dct:modified": "/dcterms/modified",
  "rdf:type": "/object-property",
} as const satisfies Record<string, RequiredEndpoints>;

// Use TS to do exhastive check of predicatesToEndpoints;
type Values<T> = T[keyof T];
type Missing = Exclude<RequiredEndpoints, Values<typeof predicatesToEndpoints>>;
type AssertNever<T extends never> = T;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _check = AssertNever<Missing>;

export type CreateTriple = {
  s: string;
  p: keyof typeof predicatesToEndpoints;
  o: string;
};

export type CreateByPredicateFn = Record<
  keyof typeof predicatesToEndpoints,
  (options: { triple: CreateTriple; dataset_uri:string }) => DispatchResult
>;

export const createByPredicateFnFactory = ({
  client,
}: {
  client: RdfWriteApiClientType;
}): CreateByPredicateFn => ({
  "dct:publisher": ({ triple }) =>
    client.POST("/dcterms/publisher", {
      body: {
        item_uri: triple.s,
        publisher_object_uri: triple.o,
      },
    }).then(throwIfHTTPError),
  "dct:title": ({ triple, dataset_uri }) =>
    client.POST("/dcterms/title", {
      body: {
        item_uri: triple.s,
        title: triple.o,
        dataset_uri
      },
    }).then(throwIfHTTPError),

  "dct:description": ({ triple, dataset_uri }) =>
    client.POST("/dcterms/description", {
      body: {
        item_uri: triple.s,
        description: triple.o,
        dataset_uri
      },
    }).then(throwIfHTTPError),

  "dct:issued": ({ triple, dataset_uri }) =>
    client.POST("/dcterms/issued", {
      body: {
        item_uri: triple.s,
        datetime: triple.o,
        dataset_uri
      },
    }).then(throwIfHTTPError),

  "dct:rights": ({ triple }) =>
    client.POST("/dcterms/rights", {
      body: {
        item_uri: triple.s,
        rights_object_uri: triple.o,
      },
    }).then(throwIfHTTPError),

  "prov:qualifiedAttribution": ({ triple }) =>
    client.POST("/prov/qualifiedAttribution", {
      body: {
        item_uri: triple.s,
        attribution_item_uri: triple.o,
      },
    }).then(throwIfHTTPError),

  "dct:identifier": ({ triple, dataset_uri }) =>
    client.POST("/dcterms/identifier", {
      body: {
        item_uri: triple.s,
        identifier: triple.o,
        dataset_uri
      },
    }).then(throwIfHTTPError),

  "dcat:contactPoint": ({ triple }) =>
    client.POST("/dcat/contactPoint", {
      body: {
        item_uri: triple.s,
        contact_point_object_uri: triple.o,
      },
    }).then(throwIfHTTPError),
  "dcat:mediaType": ({ triple }) =>
    client.POST("/dcat/mediaType", {
      body: {
        item_uri: triple.s,
        media_type_object_uri: triple.o,
      },
    }).then(throwIfHTTPError),

  "dct:modified": ({ triple }) =>
    client.POST("/dcterms/modified", {
      body: {
        item_uri: triple.s,
        datetime: triple.o,
      },
    }).then(throwIfHTTPError),
  "dcat:distribution": ({ triple }) =>
    client.POST("/dcat/distribution", {
      body: {
        item_uri: triple.s,
        distribution_uri: triple.o,
      },
    }).then(throwIfHTTPError),
  "dcat:hadRole": ({ triple }) =>
    client.POST("/dcat/hadRole", {
      body: {
        item_uri: triple.s,
        role_uri: triple.o,
      },
    }).then(throwIfHTTPError),
  "dcat:accessURL": ({ triple, dataset_uri }) =>
    client.POST("/dcat/accessURL", {
      body: {
        item_uri: triple.s,
        access_url: triple.o,
        dataset_uri
      },
    }).then(throwIfHTTPError),
  "dcterms:contributor": ({ triple }) =>
    client.POST("/dcterms/contributor", {
      body: {
        item_uri: triple.s,
        contributor_object_uri: triple.o,
      },
    }).then(throwIfHTTPError),
  "vcard:fn": ({ triple, dataset_uri }) =>
    client.POST("/vcard/fn", {
      body: {
        item_uri: triple.s,
        fn: triple.o,
        dataset_uri
      },
    }).then(throwIfHTTPError),
  "prov:agent": ({ triple }) =>
    client.POST("/prov/agent", {
      body: {
        item_uri: triple.s,
        agent_uri: triple.o,
      },
    }),
    // TODO This and annotate should be accessed differently
    "rdf:type": ({ triple }) =>
    client.POST("/object-property", {
      body: {
        dataset: "catalog", // required, else defaults to knowledge
        subject: triple.s,
        predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        object: triple.o,
      },
    }).then(throwIfHTTPError),
});
