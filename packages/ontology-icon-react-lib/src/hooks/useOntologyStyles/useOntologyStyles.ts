import * as ontologyIconLib from '@telicent-oss/ontology-icon-lib';
import { useEffect, useState } from 'react';

export function useOntologyStyles() {
  const [styles, setStyles] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const findIcon = ontologyIconLib.findByClassUri;

  useEffect(() => {
    ontologyIconLib.moduleStylesPromise.then((loadedStyles) => {
      setStyles(loadedStyles);
      setIsLoading(false);
    });
  }, []);

  return { isLoading, styles, findIcon };
}
