/**
 * Given: undefined
 * return undefined
 * 
 * Given uri : 
 * - http://telicent.io/catalog#data.owner@domain.com
 * - http://telicent.io/catalog/data.owner@domain.com
 * It will return: data.owner@acled.com
 * else throw error
 * 
 * Note: Could perhaps do in Sparql but I like being able to throw exceptions
 */
export const getHashOrLastUrlSegment = (str?: string): string | undefined => {
  if (str === undefined) {
      return undefined;
  }

  // Regular expression to match the desired parts of the URI
  const regex = /(?:#|\/)([^#\/]*)$/;

  // Test the string against the regex pattern
  const match = regex.exec(str); 

  if (match && match[1]) {
      return match[1];
  } else {
      console.warn(`Input string "${str}" is not in the expected uri "Hash" or "Slash" format`);
      return str;
  }
};