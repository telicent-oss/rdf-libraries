import { HumanError } from "../../../utils/HumanError";

export function tryCatch<T extends (...args: any[]) => any>(
  workSync: T,
  expectation: string
): ReturnType<T> {
  try {
    const result = workSync();
    if (result instanceof Promise) {
      throw new Error('tryCatch(): does not support async work functions' );
    }
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw new HumanError(`Expected ${expectation}, but caught error: ${err.message}`, err);
    } else {
      throw err; // Or handle non-Error objects differently if needed
    }
  }
}