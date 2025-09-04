import { createTwoFilesPatch } from "diff";

export const diff = (oldText: string, newText: string): string =>
  createTwoFilesPatch("a", "b", oldText, newText, "", "", { context: 0 });
