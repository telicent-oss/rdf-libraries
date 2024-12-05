// Note: For top-level types - not _all_ types (as that would risk circular-references)
import { z } from 'zod';
import { RDFSchema, RDFTripleSchema, URISegmentOrHashSchema } from './schema';

// Schema for the RDF triple
export type RDFTripleType = z.infer<typeof RDFTripleSchema>;
export type RDFType = z.infer<typeof RDFSchema>;
export type URISegmentOrHashType = z.infer<typeof URISegmentOrHashSchema>; // Lossy type

export type RDFBasetype = "URI" | "LITERAL" | "BNODE";

export type PrefixedURI = string;

export type LongURI = string;

export interface SPARQLResultBinding {
  value: LongURI | string;
  type: string;
}

export interface SPARQLQuerySolution {
}

export interface CountQuerySolution extends SPARQLQuerySolution {
  count: SPARQLResultBinding;
}

export interface TypedNodeQuerySolution extends SPARQLQuerySolution {
  uri: SPARQLResultBinding;
  _type?: SPARQLResultBinding;
}

export interface RelatedNodeQuerySolution extends TypedNodeQuerySolution {
  predicate: SPARQLResultBinding;
}

export interface LiteralPropertyQuerySolution {
  predicate: SPARQLResultBinding;
  literal: SPARQLResultBinding;
}

export interface SPOQuerySolution extends SPARQLQuerySolution {
  s: SPARQLResultBinding;
  p: SPARQLResultBinding;
  o: SPARQLResultBinding;
}

export interface SPOOSQuerySolution extends SPOQuerySolution {
  invP: SPARQLResultBinding;
  invS: SPARQLResultBinding;
  oType: SPARQLResultBinding;
  invType: SPARQLResultBinding;
  invFurther: SPARQLResultBinding;
}

export interface RelatingQuerySolution extends SPARQLQuerySolution {
  relating: SPARQLResultBinding;
  pred: SPARQLResultBinding;
}

export interface RelatedQuerySolution extends SPARQLQuerySolution {
  related: SPARQLResultBinding;
  pred: SPARQLResultBinding;
}

export interface ResourceFindSolution extends TypedNodeQuerySolution {
  concatLit: SPARQLResultBinding;
}


export type QueryResponse<T = SPARQLQuerySolution> = {
  "head": {
    "vars": string[];
  };
  "results": {
    "bindings": T[];
  };
  boolean?: boolean;
};

export type StringsDict = {
  [key: string]: string[];
};

export type ResourceDescription = {
  outLinks: {
    [key: LongURI]: StringsDict;
  };
  literals: StringsDict;
  inLinks: {
    [key: LongURI]: StringsDict;
  };
  furtherInLinks: string[];
};


export type RelatedLiterals = {
  [key: LongURI]: string[];
};

/**
 * @typeParam XsdDataType
 */
export type XsdDataType =
  | "xsd:string"
  | //	Character strings (but not all Unicode character strings)
  "xsd:boolean"
  | // true / false
  "xsd:decimal"
  | // Arbitrary-precision decimal numbers
  "xsd:integer"
  | // Arbitrary-size integer numbers
  "xsd:double"
  | // 	64-bit floating point numbers incl. ±Inf, ±0, NaN
  "xsd:float"
  | // 	32-bit floating point numbers incl. ±Inf, ±0, NaN
  "xsd:date"
  | // 	Dates (yyyy-mm-dd) with or without timezone
  "xsd:time"
  | // 	Times (hh:mm:ss.sss…) with or without timezone
  "xsd:dateTime"
  | // 	Date and time with or without timezone
  "xsd:dateTimeStamp"
  | // Date and time with required timezone
  "xsd:gYear"
  | // 	Gregorian calendar year
  "xsd:gMonth"
  | // 	Gregorian calendar month
  "xsd:gDay"
  | // 	Gregorian calendar day of the month
  "xsd:gYearMonth"
  | // 	Gregorian calendar year and month
  "xsd:gMonthDay"
  | // 	Gregorian calendar month and day
  "xsd:duration"
  | // 	Duration of time
  "xsd:yearMonthDuration"
  | //	Duration of time (months and years only)
  "xsd:dayTimeDuration"
  | //Duration of time (days, hours, minutes, seconds only)
  "xsd:byte"
  | //-128…+127 (8 bit)
  "xsd:short"
  | //	-32768…+32767 (16 bit)
  "xsd:int"
  | //	-2147483648…+2147483647 (32 bit)
  "xsd:long"
  | //-9223372036854775808…+9223372036854775807 (64 bit)
  "xsd:unsignedByte"
  | //	0…255 (8 bit)
  "xsd:unsignedShort"
  | //	0…65535 (16 bit)
  "xsd:unsignedInt"
  | //	0…4294967295 (32 bit)
  "xsd:unsignedLong"
  | //	0…18446744073709551615 (64 bit)
  "xsd:positiveInteger"
  | //	Integer numbers >0
  "xsd:nonNegativeInteger"
  | //	Integer numbers ≥0
  "xsd:negativeInteger"
  | //	Integer numbers <0
  "xsd:nonPositiveInteger"
  | //	Integer numbers ≤0
  "xsd:hexBinary"
  | //	Hex-encoded binary data
  "xsd:base64Binary"
  | //	Base64-encoded binary data
  "xsd:anyURI"
  | //	Absolute or relative URIs and IRIs
  "xsd:language"
  | //	Language tags per [BCP47]
  "xsd:normalizedString"
  | //	Whitespace-normalized strings
  "xsd:token"
  | //	Tokenized strings
  "xsd:NMTOKEN"
  | //	XML NMTOKENs
  "xsd:Name"
  | //	XML Names
  "xsd:NCName";


