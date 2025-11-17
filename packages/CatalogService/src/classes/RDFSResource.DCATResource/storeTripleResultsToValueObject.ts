import { ApiFactoryConfigType } from "src/apiFactory/operations/type";
import { UIDataResourceType } from "../../apiFactory/operations/utils/common";
import { CatalogService } from "../RdfService.CatalogService";
import { DCATResource } from "../RDFSResource.DCATResource";
import { StoreTripleOperation } from "./createOperations";
import {
  StoreTripleForOntology,
  StoreTripleMessage,
  StoreTriplesResult,
  StoreTripleError,
} from "./storeTriplesForPhase2";

type StringOrUndefinedKeys<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends string ? K : never;
}[keyof T];

export type EdgeCaseOnlyInit = { classType: string };

export type Editable = UIDataResourceType & EdgeCaseOnlyInit;
const EditableUIToProperty = {
  classType: "classType",
  identifier: "identifier",
  title: "title",
  description: "description",
  contact: "contactPoint__fn",
  creator: "publisher__title",
  rights: "rights__description",
  // accessRights: "accessRights",
  owner: "qualifiedAttribution__agent__title",
  distributionUri: "distribution",
  distributionIdentifier: "distribution__identifier",
  distributionTitle: "distribution__title",
  distributionURL: "distribution__accessURL",
  distributionMediaType: "distribution__mediaType",
  distributionAvailable: "distribution__available",
  lastModifiedBy: "contributor__title",
  publishDate: "min_issued",
  // modified: "max_modified",
} as const satisfies Partial<
  Record<keyof Editable, StringOrUndefinedKeys<DCATResource>>
>;

type EditableField = keyof typeof EditableUIToProperty;

function editableEntries(
  payload: Partial<Editable>
): Array<[EditableField, Editable[EditableField]]> {
  return (Object.entries(payload) as Array<[keyof Editable, unknown]>).filter(
    (e): e is [EditableField, Editable[EditableField]] =>
      e[0] in EditableUIToProperty || e[0] === "classType"
  );
}

type UiFields = keyof Editable | "_unknown";
export type ResourceOperationResults = {
  values: Partial<Record<UiFields, string>>;
  errors: Partial<Record<UiFields | 'form', StoreTripleError[]>>;
  messages: Partial<Record<UiFields, StoreTripleMessage[]>>;
  operations: Partial<Record<UiFields, StoreTripleOperation[]>>;
  results: Partial<Record<UiFields, StoreTriplesResult[]>>;
};

export type StoreTriplesOptions = {
  uri:string;
  instance: DCATResource;
  uiFields: Partial<Editable>;
  storeTriplesForOntology: StoreTripleForOntology;
  api: Parameters<StoreTripleForOntology>[0]["api"];
  catalogService: CatalogService;
  config?: ApiFactoryConfigType;
};

/**
 *
 *
 *
 * @returns
 */
export const storeTripleResultsToValueObject = async ({
  uri,
  uiFields,
  instance,
  storeTriplesForOntology,
  api,
  catalogService,
  config,
}: StoreTriplesOptions) => {

  // UI uses distributionUri/distributionIdentifier; mapping below converts to graph properties (distribution, distribution__identifier)
  const uiFieldEntires = editableEntries(uiFields);
  const values: ResourceOperationResults["values"] = { uri };
  const errors: ResourceOperationResults["errors"] = {};
  const messages: ResourceOperationResults["messages"] = {};
  const operations: ResourceOperationResults["operations"] = {};
  const results: ResourceOperationResults["results"] = {};
  for (const [uiField, uiFieldValue] of uiFieldEntires) {
    const result = await storeTriplesForOntology({
      instance,
      property: EditableUIToProperty[uiField],
      newValue: uiFieldValue,
      api,
      catalogService,
      sleepMsBetweenRequests: config?.QA_SLEEP_BETWEEN_CALLS,
    });
    values[uiField] = instance[EditableUIToProperty[uiField]];
    errors[uiField] = result.filter(
      (el): el is StoreTripleError => "summary" in el
    );
    messages[uiField] = result.filter((el) => "message" in el);
    operations[uiField] = result.filter((el) => "type" in el);
    results[uiField] = result;
  }
  if (Object.values(errors).some((value) => value.length)) {
    throw { values, errors, messages, operations, results };
  }
  return { values, errors, messages, operations, results };
};
