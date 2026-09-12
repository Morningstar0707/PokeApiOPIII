export const successResponse = <T>(data: T, meta?: Record<string, unknown>) => ({
  success: true,
  data,
  ...(meta ? { pagination: meta } : {}),
});

export const errorResponse = (
  code: string,
  message: string,
  statusCode: number,
) => ({
  success: false,
  error: {
    code,
    message,
    statusCode,
  },
});
