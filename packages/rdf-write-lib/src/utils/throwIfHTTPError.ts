import { DispatchResult } from "../types"

export const throwIfHTTPError = async (result:Awaited<DispatchResult>) => {
  if (result.response.status >=200 && result.response.status <= 299) {
    return result;
  }
  throw result.error?.detail
}