import { RDFTripleType } from "@telicent-oss/rdfservice";

export interface IDCAT3Interpretation {
  dcTitleFromTriples(
    id: string,
    triples: RDFTripleType[],
    options?: { assert: boolean }
  ): string | undefined;

  dcPublishedFromTriples(
    id: string,
    triples: RDFTripleType[],
    options?: { assert: boolean }
  ): string | undefined;
  creatorNameFromTriples(
    id: string,
    triples: RDFTripleType[],
    options?: { assert: boolean }
  ): string | undefined;
  creatorEmailFromTriples(
    id: string,
    triples: RDFTripleType[],
    options?: { assert: boolean }
  ): string | undefined;
  // ownerFromTriples(
  //   id: string,
  //   triples: RDFTripleType[],
  // ): string | undefined;
  rightsFromTriples(
    id: string,
    triples: RDFTripleType[],
    options?: { assert: boolean }
  ): string | undefined;
}
