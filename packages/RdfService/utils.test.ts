import { ConstructorPromises } from "./utils";

class ExampleClass extends ConstructorPromises {
  name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }
}

test("ConstructorPromises", async() => {
    const instancePromise = ExampleClass.createAsync("Alice");
    const instance = await instancePromise;
    expect(instance.name).toMatchInlineSnapshot('"Alice"');
});
