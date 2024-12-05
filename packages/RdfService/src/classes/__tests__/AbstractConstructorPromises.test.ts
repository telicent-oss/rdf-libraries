import { AbstractConstructorPromises } from "../AbstractConstructorPromises";


class ExampleClass extends AbstractConstructorPromises {
  name: string;

  constructor(name: string) {
    super();
    const somethingAsync = Promise.resolve();
    this.constructorPromises.push(somethingAsync);
    this.name = name;
  }
}

test("AbstractConstructorPromises", async() => {
    const instancePromise = ExampleClass.createAsync("Alice");
    const instance = await instancePromise;
    expect(instance.name).toMatchInlineSnapshot('"Alice"');
});
