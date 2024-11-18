export const shorten = (str: string = '', len: number = 80) =>
  str.length > len ? str.substring(0, len - 2) + "…" : str;