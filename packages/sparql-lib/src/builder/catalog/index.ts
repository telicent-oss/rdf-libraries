// Entry-point a.k.a "Barrel-file"; No code should go in here
import { getAllDCATResources } from "./getAllDCATResources/getAllDCATResources";
import { findWithOwner } from "./findWithOwner/findWithOwner";
import { findWithParams } from "./findWithParams/findWithParams";

export const catalog = { getAllDCATResources, findWithOwner, findWithParams };
