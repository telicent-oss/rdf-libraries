import { RDFTripleSchema } from "@telicent-oss/rdfservice/index";

export const makeStatic = (obj: any) =>
  JSON.parse(JSON.stringify(obj), function reviver(key, value) {
    const rdfParsed = RDFTripleSchema.safeParse(value);
    if (rdfParsed.success) {
      if (rdfParsed.data.p.value === "http://purl.org/dc/terms/published") {
        rdfParsed.data.o.value = "######## makeStatic() ########";
        return rdfParsed.data;
      }
    }
    return value;
  });
