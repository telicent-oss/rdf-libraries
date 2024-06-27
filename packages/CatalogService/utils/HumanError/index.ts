// Copied from https://github.com/telicent-oss/telicent-ontology/blob/631165faff060f42c8b9f295d4d537296fa73653/src/lib/HumanError/index.ts
export class HumanError extends Error {
  public originalError: Error;

  constructor(humanMessage: string, originalError: Error) {
    super(humanMessage);
    this.originalError = originalError;
    this.name = this.constructor.name;

    // Maintaining proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

  }
}