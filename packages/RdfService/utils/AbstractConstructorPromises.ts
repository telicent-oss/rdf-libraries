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

const instance1 = await SomeClass.createAsync(101); // WORKS

const instance2 = await SomeClass.createAsync("102"); // TS ERROR
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