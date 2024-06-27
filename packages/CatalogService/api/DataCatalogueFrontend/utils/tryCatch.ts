import { HumanError } from "../../../utils/HumanError";

// TODO warn that only works with synchronous
export function tryCatch<T extends (...args: any[]) => any>(
  workSync: T,
  expectation: string
): ReturnType<T> {
  try {
    return workSync();
  } catch (err) {
    if (err instanceof Error) {
      throw new HumanError(`Expected ${expectation}, but caught error: ${err.message}`, err);
    } else {
      throw err; // Or handle non-Error objects differently if needed
    }
  }
}