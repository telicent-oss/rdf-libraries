import { z } from "zod";
import { RDFTripleSchema } from "@telicent-oss/rdfservice";
import { CatalogService, formatDataAsArray } from "../../../index";

import {
  UIDataResourceSchema,
  uiDataResourceFromInstanceWithTriples,
  typeStatementMatcherWithId,
  DCATResourceSchema,
  UISearchParamsType,
  getAllRDFTriples,
  UIDataResourceType,
} from "./utils/common";
import { getAllResourceTriples } from "./utils/getAllResourceTriples";
import { transformDataResourceFilters } from "./utils/transformDataResourceFilters";
import { tryCatch } from "./utils/tryCatch";
import { session } from "../../constants";
import { tryInstantiate } from "./utils/tryInstantiate/tryInstantiate";

export const searchFactory = (service: CatalogService) => {
  return async function search(
    params: UISearchParamsType
  ): Promise<Array<z.infer<typeof UIDataResourceSchema>>> {
    const { hasAccess, dataResourceFilter } = transformDataResourceFilters(
      params.dataResourceFilters
    );
    const rdfTriples = await getAllRDFTriples({
      service,
      // TODO! Fix hasAccess
      // ADD `hasAccess` to `getAllRDFTriples`
      // WHEN know priority
    });

    const triples = rdfTriples.results.bindings.map((el) =>
      RDFTripleSchema.parse(el)
    );

    if (triples.length === 0) {
      return [];
    }

    const resourceTriples = await getAllResourceTriples({ service, hasAccess });
    const ownerTriple =
      dataResourceFilter === "all"
        ? undefined
        : resourceTriples.find(typeStatementMatcherWithId(dataResourceFilter));
    const ownerType = tryCatch(
      () =>
        ownerTriple
          ? DCATResourceSchema.parse(ownerTriple?.o.value)
          : undefined,
      `Expected ownerTriple.o.value ("${ownerTriple?.o.value}") to pass DCATResourceSchema`
    );
    const owner = ownerType
      ? await tryInstantiate({
          type: ownerType,
          id: dataResourceFilter,
          service,
        })
      : undefined; // Unnecessary
    const found = await service.findWithParams({
      searchText: params.searchText,
      owner,
      accessRights: hasAccess ? session.user.name : undefined,
    });
    const foundForUI = (
      await Promise.all(
        found
          .map((el) => el.item)
          .map(async (el) => {
            try {
              return await uiDataResourceFromInstanceWithTriples(triples)(el);
            } catch (err) {
              console.error(
                [
                  `uiDataResourceFromInstanceWithTriples Failed to convert to UI:`,
                  `class for ${el.uri}`,
                  `using:`,
                  formatDataAsArray(triples, 100).join('\n'),
                ].join("\n")
              );
            }
            return undefined;
          })
      )
    ).filter((el): el is UIDataResourceType => el !== undefined);
    const searchResult = await Promise.all(foundForUI);
    // console.log(safeStringify({ owner, triples, found, foundForUI }, undefined, 2));
    return searchResult;
  };
};
