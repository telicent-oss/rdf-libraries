import { AsyncInitializable } from "./utils";

class ExampleClass extends AsyncInitializable {
  name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }
}

test("AsyncInitializable", async() => {
    const instancePromise = ExampleClass.createAsync("Alice");
    const instance = await instancePromise;
    expect(instance.name).toMatchInlineSnapshot('"Alice"');
});
