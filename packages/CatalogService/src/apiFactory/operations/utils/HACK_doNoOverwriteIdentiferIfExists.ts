import {
  builder,
  type DistributionByUriResult,
} from "@telicent-oss/sparql-lib";
import { ResourceUpdateParamsType } from "../resourceUpdateFactory/resourceUpdateFactory";
import { CatalogService } from "../../../classes/RdfService.CatalogService";
import { DISTRIBUTION_NAMESPACE } from "../../../constants";

export async function HACK_doNoOverwriteIdentiferIfExists(
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
  console.log({
    currentDistribution,
    currentIdentifier,
    distributionIdentifier: payload.distributionIdentifier,
  });
  if (currentIdentifier && currentIdentifier !== payload.distributionIdentifier) {
    payload.distributionIdentifier = currentIdentifier;
  }
  // If distribution is attached to this dataset (and greyed out) already then ignore
  // const currentAttachedDataset = currentDistribution?.dataset?.value
  // if (currentAttachedDataset && currentAttachedDataset !== payload.uri) {
  //   payload.distributionUri = undefined;
  // }
  return payload;
}
