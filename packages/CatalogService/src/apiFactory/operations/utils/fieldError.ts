export type FieldError = {
  code: string;
  summary: string;
  context?: Record<string, string>;
  details?: string;
};

export const withContext = (
  error: FieldError,
  context: Record<string, string>
): FieldError => ({
  ...error,
  context: { ...(error.context || {}), ...context },
});
