import * as ontologyIconLib from '@telicent-oss/ontology-icon-lib';
import { type IconType } from '@telicent-oss/ontology-icon-lib';
import { useEffect, useState } from 'react';


export function useOntologyStyles() {
  const [styles, setStyles] = useState<IconType[]>(ontologyIconLib.moduleStyles || []);
  const [isLoading, setIsLoading] = useState(true);
  const findIcon = ontologyIconLib.findByClassUri;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ontologyIconLib.moduleStylesPromise.then((loadedStyles) => {
      if (!Array.isArray(loadedStyles)) {
        throw new Error(`useOntologyStyles interally expected moduleStylesPromise to load array of ontology styles, instead got ${loadedStyles}`);
      }
      setStyles(loadedStyles);
      setIsLoading(false);
    });
  }, []);

  return { isLoading, styles, findIcon };
}
