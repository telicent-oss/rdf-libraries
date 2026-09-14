import {
  CatalogService,
  DCATCatalog,
  DCATDataService,
  DCATDataset,
  DCATResource,
} from "../index";

const NO_WARNINGS = { config: { NO_WARNINGS: true } };

describe("DCATCatalog", () => {
  let cs: CatalogService;
  let cat: DCATCatalog;

  beforeEach(() => {
    cs = new CatalogService({ writeEnabled: true, ...NO_WARNINGS });
    jest.spyOn(cs, "insertTriple").mockResolvedValue("ok");
    cat = new DCATCatalog(cs, "http://example.test/cat1", "Parent Catalog");
  });

  describe("addOwnedCatalog", () => {
    it("inserts a dcat:catalog triple pointing to the child catalog", async () => {
      const child = new DCATCatalog(cs, "http://example.test/child", "Child");
      // clear the ctor-time calls before the assertion window
      (cs.insertTriple as jest.Mock).mockClear();

      await cat.addOwnedCatalog(child);
      expect(cs.insertTriple).toHaveBeenCalledWith(
        cat.uri,
        "http://www.w3.org/ns/dcat#catalog",
        child.uri
      );
    });

    it("is a no-op when catalog is falsy", async () => {
      (cs.insertTriple as jest.Mock).mockClear();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await cat.addOwnedCatalog(undefined as any);
      expect(cs.insertTriple).not.toHaveBeenCalled();
    });
  });

  describe("addOwnedDataset", () => {
    it("inserts a dcat:dataset triple pointing to the dataset", async () => {
      const ds = new DCATDataset(cs, "http://example.test/ds", "Dataset");
      (cs.insertTriple as jest.Mock).mockClear();

      await cat.addOwnedDataset(ds);
      expect(cs.insertTriple).toHaveBeenCalledWith(
        cat.uri,
        "http://www.w3.org/ns/dcat#dataset",
        ds.uri
      );
    });

    it("is a no-op when dataset is falsy", async () => {
      (cs.insertTriple as jest.Mock).mockClear();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await cat.addOwnedDataset(undefined as any);
      expect(cs.insertTriple).not.toHaveBeenCalled();
    });
  });

  describe("addOwnedService", () => {
    it("inserts a dcat:service triple pointing to the service", async () => {
      const svc = new DCATDataService(cs, "http://example.test/svc", "Svc");
      (cs.insertTriple as jest.Mock).mockClear();

      await cat.addOwnedService(svc);
      expect(cs.insertTriple).toHaveBeenCalledWith(
        cat.uri,
        "http://www.w3.org/ns/dcat#service",
        svc.uri
      );
    });

    it("is a no-op when service is falsy", async () => {
      (cs.insertTriple as jest.Mock).mockClear();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await cat.addOwnedService(undefined as any);
      expect(cs.insertTriple).not.toHaveBeenCalled();
    });
  });

  describe("addOwnedResource (dispatch by className)", () => {
    it("routes DCATCatalog through addOwnedCatalog", async () => {
      const spy = jest.spyOn(cat, "addOwnedCatalog").mockResolvedValue("ok");
      const child = new DCATCatalog(cs, "http://example.test/c2", "Child");
      await cat.addOwnedResource(child);
      expect(spy).toHaveBeenCalledWith(child);
    });

    it("routes DCATDataset through addOwnedDataset", async () => {
      const spy = jest.spyOn(cat, "addOwnedDataset").mockResolvedValue("ok");
      const ds = new DCATDataset(cs, "http://example.test/d2", "D");
      await cat.addOwnedResource(ds);
      expect(spy).toHaveBeenCalledWith(ds);
    });

    it("routes DCATDataService through addOwnedService", async () => {
      const spy = jest.spyOn(cat, "addOwnedService").mockResolvedValue("ok");
      const svc = new DCATDataService(cs, "http://example.test/s2", "S");
      await cat.addOwnedResource(svc);
      expect(spy).toHaveBeenCalledWith(svc);
    });

    it("warns and inserts a fallback dcat:Resource triple for an unknown className", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
      const unknown = new DCATResource(cs, "http://example.test/unknown", "X");
      unknown.className = "SomethingElse";
      (cs.insertTriple as jest.Mock).mockClear();

      await cat.addOwnedResource(unknown);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("addOwnedResource()"),
        "SomethingElse",
        expect.any(String)
      );
      expect(cs.insertTriple).toHaveBeenCalledWith(
        unknown.uri,
        "http://www.w3.org/ns/dcat#Resource",
        cat.uri
      );
    });
  });

  describe("getOwnedResources / getOwnedCatalogs / getOwnedDatasets / getOwnedServices", () => {
    it("getOwnedResources delegates to service.getAllDCATResources with the parent uri", async () => {
      const spy = jest
        .spyOn(cs, "getAllDCATResources")
        .mockResolvedValue([]);

      await cat.getOwnedResources("dcat:Catalog");
      expect(spy).toHaveBeenCalledWith("dcat:Catalog", cat.uri);
    });

    it("getOwnedCatalogs asks for dcat:Catalog under the parent uri", async () => {
      const spy = jest
        .spyOn(cs, "getAllDCATResources")
        .mockResolvedValue([]);
      await cat.getOwnedCatalogs();
      expect(spy).toHaveBeenCalledWith(cs.dcatCatalog, cat.uri);
    });

    it("getOwnedDatasets asks for dcat:Dataset under the parent uri", async () => {
      const spy = jest
        .spyOn(cs, "getAllDCATResources")
        .mockResolvedValue([]);
      await cat.getOwnedDatasets();
      expect(spy).toHaveBeenCalledWith(cs.dcatDataset, cat.uri);
    });

    it("getOwnedServices asks for dcat:DataService under the parent uri", async () => {
      const spy = jest
        .spyOn(cs, "getAllDCATResources")
        .mockResolvedValue([]);
      await cat.getOwnedServices();
      expect(spy).toHaveBeenCalledWith(cs.dcatDataService, cat.uri);
    });
  });
});
