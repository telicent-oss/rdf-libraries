import { OntologyService } from "@telicent-oss/ontologyservice";
import { findByClassUri, init } from "./index";

const style = {
  defaultStyles: {
    dark: { backgroundColor: "<backgroundColor>", color: "<color>" },
  },
  defaultIcons: { faIcon: "<faIcon>", faUnicode: "<faUnicode>" },
};

// An OntologyService from before getInheritedStyles existed
class LegacyOntologyService {
  getStyles = jest.fn(() =>
    Promise.resolve({ ["http://example.com#term"]: style })
  );
}

describe("init with an OntologyService that has no getInheritedStyles", () => {
  it("falls back to getStyles and warns", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const service = new LegacyOntologyService();

    await init(Promise.resolve(service as unknown as OntologyService));

    expect(service.getStyles).toHaveBeenCalledWith([]);
    expect(warn).toHaveBeenCalledWith(
      "OntologyService has no getInheritedStyles(), styles will not be inherited"
    );
    expect(findByClassUri("http://example.com#term").faIcon).toBe("<faIcon>");
    warn.mockRestore();
  });
});
