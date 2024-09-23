import { RDFTripleType } from "@telicent-oss/rdfservice";
import { DCATDataset, DCATDataService, DCATCatalog, UIDataResourceType } from "../../../../index";
import { getValuesByBailey } from "./getValuesByBailey";

export const getValuesByCola = async (
  el: DCATDataset | DCATDataService | DCATCatalog,
  // interpretation:DCAT3InterpretationByCola,
  triples: RDFTripleType[]

):Promise<Partial<UIDataResourceType>> => {
  const interpretation = el.service.interpretation;
  // const title = interpretation.dcTitleFromTriples(el.uri, triples, { assert: true });
  const creatorName = interpretation.creatorNameFromTriples(el.uri, triples);
  const creatorEmail = interpretation.creatorEmailFromTriples(el.uri, triples);
  const rights = interpretation.rightsFromTriples(el.uri, triples);
  const baileyValues = await getValuesByBailey(el)
  
  // Two alternatives
  const publishDate = interpretation.dcPublishedFromTriples(el.uri, triples);
  // TODO Likely fully remove getLiteralsList
  // WHY Making a sparql seems wasteful and confusing
  // SEE comments in DCAT3InterpretationByBailey
  // HOW 
  //  1. Get consensus on arch
  //  2. Remove getLiteralsList in RdfService/index.ts
  //  3. remove the line below
  // const [publishDate] = await el.getLiteralsList({ key: 'http://purl.org/dc/terms/issued', validate: (values:any) => z.array(z.string()).length(1)});

  // el.service.getL getLiteralsList({ key: })
  // const dcModified = await el.getDcModified();

  return {
    ...baileyValues,
    publishDate,
    creator: creatorName,
    contactEmail: creatorEmail,
    rights
    // owner?

  };
};
