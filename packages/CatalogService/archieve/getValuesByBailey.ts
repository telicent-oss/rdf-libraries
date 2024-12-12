import {
  DCATDataset,
  DCATDataService,
  DCATCatalog,
  UIDataResourceType,
  UIDataResourceSchema,
} from "../index";
import { session } from "./constants";

export const getValuesByBailey = async (
  el: DCATDataset | DCATDataService | DCATCatalog
): Promise<UIDataResourceType> => {
  // TODO More validation ceremony
  // HOW Stricter validation when needed (frontend v.s. RDF/schema specs)
  // WHEN Have locked down UI requirements
  if (el.types.length !== 1) {
    throw new TypeError(
      `Expected types.length of ${el.uri} to be 1, instead got ${
        el.types.length
      }:${el.types.join(", ")})`
    );
  }
  const dcTitle = await el.getDcTitle();
  if (dcTitle.length > 1) {
    console.warn(
      `Data Catalogue frontend only supports 1 title, instead got ${
        dcTitle.length
      }: ${dcTitle.join(", ")}`
    );
  }

  const dcDescription = await el.getDcDescription();
  if (dcDescription.length > 1) {
    console.warn(
      `Data Catalogue frontend only supports 1 description, instead got ${
        dcDescription.length
      }: ${dcDescription.join(", ")}`
    );
  }
  const dcRights = await el.getDcRights();
  if (!dcRights?.length) {
    console.warn(
      `Data Catalogue frontend expects dcRights to exist, instead got ${dcRights}`
    );
  }

  const dcAccessRights = await el.getDcAccessRights();
  if (!dcAccessRights?.length) {
    console.warn(
      `Data Catalogue frontend expects dcAccessRights to exist, instead got ${dcAccessRights}`
    );
  }
  // TODO mock
  //    TODO 16Sep24 Unsure what above means; perhaps reminder to add mock name?
  const userHasAccess = dcRights.includes(session.user.name);

  const dcCreator = await el.getDcCreator();
  const dcPublished = await el.getDcPublished();
  const dcModified = await el.getDcModified();

  return {
    id: el.uri,
    title: dcTitle[0],
    description: dcDescription[0] || "",
    creator: dcCreator[0] || "Standard McDefaultFace",
    userHasAccess,
    publishDate: dcPublished[0] || "-",
    modified: dcModified[0] || "-",
    accessRights: dcAccessRights[0] || "-",
    rights: dcRights[0] || "-",
    contactEmail: "-",
    type: UIDataResourceSchema.shape.type.parse(el.types[0].split("#")[1]),
  };
};
