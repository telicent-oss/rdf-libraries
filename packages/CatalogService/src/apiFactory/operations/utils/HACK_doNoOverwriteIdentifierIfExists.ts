import {
  builder,
  type DistributionByUriResult,
} from "@telicent-oss/sparql-lib";
import { ResourceUpdateParamsType } from "../resourceUpdateFactory/resourceUpdateFactory";
import { CatalogService } from "../../../classes/RdfService.CatalogService";
import { DISTRIBUTION_NAMESPACE } from "../../../constants";


/**
 * Stops the distributionIdentifier from being overwritten if a distribution
 * with the given URI already exists in the catalog.
 *
 * I can't remember exactly why I added this safety mechanism - but:
 * - In the UI, distributionUri and identifier are coupled (one input field populates both)
 * - Once a distribution is created, it cannot be edited in the UI
 * - This function enforces identifier immutability at the data layer
 *
 * If an existing distribution is found with a different identifier than what's in the payload,
 * the payload's identifier is replaced with the existing one to prevent unintended changes.
 *
 *
 * @remarks This is marked as a HACK as its a time and place fix:
 * 1, its continuing the loose UI coupling
 * 2. defensive programming to prevent accidental identifier changes
 * 
 * 
 * @param catalogService - The catalog service instance
 * @param payload - The operation payload containing distributionUri and distributionIdentifier
 * @returns The payload, potentially with the distributionIdentifier replaced with the existing value
 */
export async function HACK_doNoOverwriteIdentifierIfExists(
  catalogService: CatalogService,
  payload: ResourceUpdateParamsType["payload"]
) {

  const proposedUri = `${DISTRIBUTION_NAMESPACE}${payload.distributionUri}`;
  const currentDistribution =
    (await catalogService.runQuery<DistributionByUriResult>(
      builder.catalog.getDistributionByUri({
        distributionUri: proposedUri,
      })
    )).results.bindings[0];

  const currentIdentifier = currentDistribution.identifier?.value
  if (currentIdentifier && currentIdentifier !== payload.distributionIdentifier) {
    payload.distributionIdentifier = currentIdentifier;
  }
  return payload;
}
