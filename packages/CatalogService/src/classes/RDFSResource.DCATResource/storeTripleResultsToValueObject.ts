import { UIDataResourceType } from "../../apiFactory/operations/utils/common";
import { DCATResource } from "../RDFSResource.DCATResource";
import { StoreTripleOperation } from "./createOperations";
import {
  StoreTripleError,
  StoreTripleForOntology,
  StoreTripleMessage,
  StoreTriplesResult,
} from "./storeTriplesForPhase2";
// import { updateModifiedFactory } from "./updateModifiedFactory";

type StringOrUndefinedKeys<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends string ? K : never;
}[keyof T];

export type EdgeCaseOnlyInit = { classType: string };

type Editable = UIDataResourceType & EdgeCaseOnlyInit;
const UIToProperty = {
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
  modified: "max_modified",
} as const satisfies Partial<
  Record<keyof Editable, StringOrUndefinedKeys<DCATResource>>
>;

type EditableField = keyof typeof UIToProperty;

function editableEntries(
  payload: Partial<Editable>
): Array<[EditableField, Editable[EditableField]]> {
  return (Object.entries(payload) as Array<[keyof Editable, unknown]>).filter(
    (e): e is [EditableField, Editable[EditableField]] =>
      e[0] in UIToProperty || e[0] === "classType"
  );
}

type UiFields = keyof Editable;
export type ResourceOperationResults = {
  values: Partial<Record<UiFields, string>>;
  errors: Partial<Record<UiFields, StoreTripleError[]>>;
  messages: Partial<Record<UiFields, StoreTripleMessage[]>>;
  operations: Partial<Record<UiFields, StoreTripleOperation[]>>;
  results: Partial<Record<UiFields, StoreTriplesResult[]>>;
};

type StoreTriplesOptions = {
  instance: DCATResource;
  uiFields: Partial<Editable>;
  storeTriplesForOntology: StoreTripleForOntology;
  api: Parameters<StoreTripleForOntology>[0]["api"];
};

/**
 *
 *
 *
 * @returns
 */
export const storeTripleResultsToValueObject = async ({
  uiFields,
  instance,
  storeTriplesForOntology,
  api,
}: StoreTriplesOptions) => {
  // const updateModifiedDate = updateModifiedFactory({
  //   instance,
  //   api,
  // });

  const uiFieldEntires = editableEntries(uiFields);
  const values: ResourceOperationResults["values"] = {};
  const errors: ResourceOperationResults["errors"] = {};
  const messages: ResourceOperationResults["messages"] = {};
  const operations: ResourceOperationResults["operations"] = {};
  const results: ResourceOperationResults["results"] = {};
  for (const [uiField, uiFieldValue] of uiFieldEntires) {
    const result = await storeTriplesForOntology({
      instance,
      property: UIToProperty[uiField],
      newValue: uiFieldValue,
      api,
    });
    // updateModifiedDate();
    values[uiField] = instance[UIToProperty[uiField]];
    errors[uiField] = result.filter((el) => "error" in el);
    messages[uiField] = result.filter((el) => "message" in el);
    operations[uiField] = result.filter((el) => "type" in el);
    results[uiField] = result;
  }
  if (Object.values(errors).some((value) => value.length)) {
    throw { values, errors, messages, operations, results };
  }
  return { values, errors, messages, operations, results };
};
