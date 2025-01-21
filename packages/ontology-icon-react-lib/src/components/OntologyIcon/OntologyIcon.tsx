import React, { Suspense } from "react";
import { TeliTypeIcon } from "@telicent-oss/ds";
import { TeliTypeIconProps } from "@telicent-oss/ds";
import * as ontologyFindIconHelper from "@telicent-oss/ontology-icon-lib";
import { URISegmentOrHashType } from "@telicent-oss/rdfservice";
import { use } from "@telicent-oss/react-lib";
import { ErrorBoundary } from "react-error-boundary";

type OntologyIconProps = { type: URISegmentOrHashType } & Omit<
  TeliTypeIconProps,
  "icon"
>;

export const OntologyIcon = ({
  type,
  ...propsExceptIcon
}: OntologyIconProps) => {
  use(ontologyFindIconHelper.moduleStylesPromise);
  return (
    <Suspense fallback="">
      <ErrorBoundary fallback={"⚠️"}>
        <TeliTypeIcon
          icon={ontologyFindIconHelper.findByClassUri(type)}
          // Maintainability: Have no _nice_ way to FORCE explicity prop setting based on type error
          {...propsExceptIcon}
        />
      </ErrorBoundary>
    </Suspense>
  );
};
