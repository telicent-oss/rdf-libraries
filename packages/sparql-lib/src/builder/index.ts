// Entry-point a.k.a "Barrel-file"; No code should go in here
import { catalog } from "./catalog";
export { type DistributionByUriResult } from "./catalog/getDistributionByUri/getDistributionByUri";

export const builder =  { catalog };
