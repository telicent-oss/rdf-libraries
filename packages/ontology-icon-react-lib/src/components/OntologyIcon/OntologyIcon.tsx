import React, { Suspense, use } from "react";
import { TeliTypeIcon } from "@telicent-oss/ds";
import * as ontologyFindIconHelper from "@telicent-oss/ontology-icon-lib";
import { URISegmentOrHashType } from "@telicent-oss/rdfservice";
import { ErrorBoundary } from "react-error-boundary";

// ds does not publicly export its icon props type; derive it from the component.
type TeliTypeIconProps = React.ComponentProps<typeof TeliTypeIcon>;

type OntologyIconProps = { type: URISegmentOrHashType } & Omit<
  TeliTypeIconProps,
  "icon"
>;

const ClassIcon = ({ type, ...propsExceptIcon }: OntologyIconProps) => (
  <TeliTypeIcon
    icon={ontologyFindIconHelper.findByClassUri(type)}
    // Maintainability: Have no _nice_ way to FORCE explicity prop setting based on type error
    {...propsExceptIcon}
  />
);

export const OntologyIcon = (props: OntologyIconProps) => {
  use(ontologyFindIconHelper.moduleStylesPromise);
  return (
    <Suspense fallback="">
      <ErrorBoundary fallback={"⚠️"}>
        <ClassIcon {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};
