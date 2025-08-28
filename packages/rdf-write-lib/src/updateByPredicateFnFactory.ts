import { RdfWriteApiClientType } from "./rdfWriteApiClientFactory";
import { DispatchResult, Endpoints } from "./types";
import { throwIfHTTPError } from "./utils/throwIfHTTPError";

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
  | "/object-property/delete"
  | "/prov/qualifiedAttribution"
  | "/prov/qualifiedAttribution/delete"
  | "/prov/agent"
  | "/prov/agent/delete"
  | "/dcterms/contributor"
  | "/dcterms/contributor/delete"
  | "/dcat/contactPoint"
  | "/dcat/contactPoint/delete"
  | "/dcat/mediaType"
  | "/dcat/mediaType/delete"
  | "/dcat/distribution"
  | "/dcat/distribution/delete"
  | "/dcat/hadRole"
  | "/dcat/hadRole/delete"
  | "/dcat/accessURL"
  | "/dcat/accessURL/delete"
  | "/vcard/fn"
  | "/vcard/fn/delete";

type RequiredEndpoints = Exclude<Endpoints, OmitEndpoints>;

const predicatesToEndpoints = {
  "dcat:distribution": "/dcat/distribution/update",
  "dcat:hadRole": "/dcat/hadRole/update",
  "dcat:accessURL": "/dcat/accessURL/update",
  "dcterms:contributor": "/dcterms/contributor/update",
  "vcard:fn": "/vcard/fn/update",
  "dct:publisher": "/dcterms/publisher/update",
  "dct:title": "/dcterms/title/update",
  "dct:description": "/dcterms/description/update",
  "dct:issued": "/dcterms/issued/update",
  "dct:rights": "/dcterms/rights/update",
  "dcat:contactPoint": "/dcat/contactPoint/update",
  "dcat:mediaType": "/dcat/mediaType/update",
  "prov:qualifiedAttribution": "/prov/qualifiedAttribution/update",
  "prov:agent": "/prov/agent/update",
  "dct:identifier": "/dcterms/identifier/update",
  "dct:modified": "/dcterms/modified/update",
  "rdf:type": "/object-property",
} as const satisfies Record<string, RequiredEndpoints>;

// Use TS to do exhastive check of predicatesToEndpoints;
type Values<T> = T[keyof T];
type Missing = Exclude<RequiredEndpoints, Values<typeof predicatesToEndpoints>>;
type AssertNever<T extends never> = T;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _check = AssertNever<Missing>;

export type UpdateTriple = {
  s: string;
  p: keyof typeof predicatesToEndpoints;
  o: string;
};

export type UpdateByPredicateFn = Record<
  keyof typeof predicatesToEndpoints,
  (options: { triple: UpdateTriple; prev: string | null; dataset_uri:string }) => DispatchResult
>;

export const updateByPredicateFnFactory = ({
  client,
}: {
  client: RdfWriteApiClientType;
}): UpdateByPredicateFn => ({
  "dct:publisher": ({ triple, prev }) =>
    client.POST("/dcterms/publisher/update", {
      body: {
        item_uri: triple.s,
        old_publisher_object_uri: prev as unknown as string,
        new_publisher_object_uri: triple.o,
      },
    }).then(throwIfHTTPError),
  "dct:title": ({ triple, prev, dataset_uri }) =>
    client.POST("/dcterms/title/update", {
      body: {
        item_uri: triple.s,
        old_title: prev as unknown as string,
        new_title: triple.o,
        dataset_uri
      },
    }).then(throwIfHTTPError),

  "dct:description": ({ triple, prev, dataset_uri }) =>
    client.POST("/dcterms/description/update", {
      body: {
        item_uri: triple.s,
        old_description: prev as unknown as string,
        new_description: triple.o,
        dataset_uri
      },
    }).then(throwIfHTTPError),

  "dct:issued": ({ triple, prev, dataset_uri }) =>
    client.POST("/dcterms/issued/update", {
      body: {
        item_uri: triple.s,
        old_datetime: prev as unknown as string,
        new_datetime: triple.o,
        dataset_uri
      },
    }).then(throwIfHTTPError),

  "dct:rights": ({ triple, prev, dataset_uri }) =>
    client.POST("/dcterms/rights/update", {
      body: {
        item_uri: triple.s,
        old_rights_object_uri: prev as unknown as string,
        new_rights_object_uri: triple.o,
        dataset_uri
      },
    }).then(throwIfHTTPError),

  "prov:qualifiedAttribution": ({ triple, prev, dataset_uri }) =>
    client.POST("/prov/qualifiedAttribution/update", {
      body: {
        item_uri: triple.s,
        old_attribution_item_uri: prev as unknown as string,
        new_attribution_item_uri: triple.o,
        dataset_uri
      },
    }).then(throwIfHTTPError),

  "dct:identifier": ({ triple, prev, dataset_uri }) =>
    client.POST("/dcterms/identifier/update", {
      body: {
        item_uri: triple.s,
        old_identifier: prev as unknown as string,
        new_identifier: triple.o,
        dataset_uri
      },
    }).then(throwIfHTTPError),

  "dcat:contactPoint": ({ triple, prev, dataset_uri }) =>
    client.POST("/dcat/contactPoint/update", {
      body: {
        item_uri: triple.s,
        old_contact_point_object_uri: prev as unknown as string,
        new_contact_point_object_uri: triple.o,
        dataset_uri
      },
    }).then(throwIfHTTPError),
  "dcat:mediaType": ({ triple, prev }) =>
    client.POST("/dcat/mediaType/update", {
      body: {
        item_uri: triple.s,
        old_media_type_object_uri: prev as unknown as string,
        new_media_type_object_uri: triple.o,
      },
    }).then(throwIfHTTPError),

  "dct:modified": ({ triple, prev }) =>
    client.POST("/dcterms/modified/update", {
      body: {
        item_uri: triple.s,
        old_datetime: prev as unknown as string,
        new_datetime: triple.o,
      },
    }).then(throwIfHTTPError),
  "dcat:distribution": ({ triple, prev }) =>
    client.POST("/dcat/distribution/update", {
      body: {
        item_uri: triple.s,
        old_distribution_uri: prev as unknown as string,
        new_distribution_uri: triple.o,
      },
    }).then(throwIfHTTPError),
  "dcat:hadRole": ({ triple, prev }) =>
    client.POST("/dcat/hadRole/update", {
      body: {
        item_uri: triple.s,
        old_role_uri: prev as unknown as string,
        new_role_uri: triple.o,
      },
    }).then(throwIfHTTPError),
  "dcat:accessURL": ({ triple, prev, dataset_uri }) =>
    client.POST("/dcat/accessURL/update", {
      body: {
        item_uri: triple.s,
        old_access_url: prev as unknown as string,
        new_access_url: triple.o,
        dataset_uri,
      },
    }).then(throwIfHTTPError),
  "dcterms:contributor": ({ triple, prev }) =>
    client.POST("/dcterms/contributor/update", {
      body: {
        item_uri: triple.s,
        old_contributor_object_uri: prev as unknown as string,
        new_contributor_object_uri: triple.o,
      },
    }).then(throwIfHTTPError),
  "vcard:fn": ({ triple, prev, dataset_uri }) =>
    client.POST("/vcard/fn/update", {
      body: {
        item_uri: triple.s,
        old_fn: prev as unknown as string,
        new_fn: triple.o,
        dataset_uri
      },
    }).then(throwIfHTTPError),
  "prov:agent": ({ triple, prev }) =>
    client.POST("/prov/agent/update", {
      body: {
        item_uri: triple.s,
        old_agent_uri: prev as unknown as string,
        new_agent_uri: triple.o,
      },
    }).then(throwIfHTTPError),
  /**
   * !CRITICAL. Test. Perhaps remove.
   * WHEN https://telicent.atlassian.net/browse/TELFE-1275
   * WHY in rush. Implemented to keep types simple
   *  */
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
