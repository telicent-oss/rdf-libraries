import { AbstractConstructorPromises } from "./utils";

class ExampleClass extends AbstractConstructorPromises {
  name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }
}

test("AbstractConstructorPromises", async() => {
    const instancePromise = ExampleClass.createAsync("Alice");
    const instance = await instancePromise;
    expect(instance.name).toMatchInlineSnapshot('"Alice"');
});
