import { HttpResponse } from "msw";

export const errorResponse = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message, details: [] } }, { status });
