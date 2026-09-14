import { RdfService } from "@telicent-oss/rdfservice";
import { IESService } from "./IESService";

describe("IESService", () => {
  describe("constructor", () => {
    it("applies DEFAULT_OPTIONS when only writeEnabled is passed", () => {
      const service = new IESService({ writeEnabled: false });

      expect(service.triplestoreUri).toBe(IESService.DEFAULT_OPTIONS.triplestoreUri);
      expect(service.dataset).toBe(IESService.DEFAULT_OPTIONS.dataset);
      expect(service.defaultNamespace).toBe(IESService.DEFAULT_OPTIONS.defaultNamespace);
      expect(service.defaultSecurityLabel).toBe(IESService.DEFAULT_OPTIONS.defaultSecurityLabel);
    });

    it("overrides each option individually", () => {
      const service = new IESService({
        writeEnabled: true,
        triplestoreUri: "http://example.test:9999/",
        dataset: "custom-ds",
        defaultNamespace: "http://example.test/ns#",
        defaultSecurityLabel: "OFFICIAL",
      });

      expect(service.triplestoreUri).toBe("http://example.test:9999/");
      expect(service.dataset).toBe("custom-ds");
      expect(service.defaultNamespace).toBe("http://example.test/ns#");
      expect(service.defaultSecurityLabel).toBe("OFFICIAL");
    });

    it("derives query and update endpoints from triplestoreUri + dataset", () => {
      const service = new IESService({
        writeEnabled: false,
        triplestoreUri: "http://example.test:9999/",
        dataset: "my-ds",
      });

      expect(service.queryEndpoint).toBe("http://example.test:9999/my-ds/query");
      expect(service.updateEndpoint).toBe("http://example.test:9999/my-ds/update");
    });

    it("forwards config to the parent RdfService", () => {
      const service = new IESService({
        writeEnabled: false,
        config: { NO_WARNINGS: true },
      });

      expect(service.config).toEqual({ NO_WARNINGS: true });
    });

    it("is an instance of RdfService", () => {
      const service = new IESService({ writeEnabled: false });
      expect(service).toBeInstanceOf(RdfService);
    });
  });

  describe("DEFAULT_OPTIONS", () => {
    it("exposes the IES-specific defaults", () => {
      expect(IESService.DEFAULT_OPTIONS).toEqual({
        triplestoreUri: "http://localhost:3030/",
        dataset: "ies",
        defaultNamespace: "http://ies.data.gov.uk/ontology/ies4/",
        defaultSecurityLabel: "",
      });
    });
  });
});
