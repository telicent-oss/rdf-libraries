/* 

Usage:

```ts
class SomeClass extends AbstractConstructorPromises {
    constructor(public id: number) {
        super();
        this.constructorPromises.push(this.workAsync());
    }

    private async workAsync(): Promise<void> {
        return fetch(`https://api.domain.com/entity/${this.id}`).then(() => {});
    }
}

* AbstractConstructorPromises gives classes a static factory function 
* called `createAsync`. Which makes it more convenient to:
* 1. Instantiate a class
* 2. WAIT for any promises created in the constructor to resolve
* 3. Retain type-checking of constructor params

* WORKS FINE
* Without using createAsync:
const instance100Promise = new SomeClass(100); 
await Promise.all(instance100Promise.constructorPromises);
* With createAsync:
const instance101 = await SomeClass.createAsync(101);

* Same as above, but creates TS ERRORS!
const instance102Promise = new SomeClass("102");
const instance103 = await SomeClass.createAsync("103");
```
*/
export abstract class AbstractConstructorPromises {
    constructorPromises: Promise<unknown>[] = [];
    // TODO warn if instantiated via `new Class` instead of `Class.createAsync`
    // Define a strongly typed static factory method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static async createAsync<T extends AbstractConstructorPromises, Args extends any[]>(
        this: new (...args: Args) => T,
        ...args: Args
    ): Promise<T> {
        const instance = new this(...args);
        await instance.getConstructorPromises();
        return instance;
    }

    async getConstructorPromises(): Promise<void> {
        await Promise.all(this.constructorPromises);
    }
}

