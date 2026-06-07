import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "api_error"
  ) {
    super(message);
  }
}

export function forbidden(message = "Keine Berechtigung") {
  return new ApiError(403, message, "forbidden");
}

export function notFound(message = "Nicht gefunden") {
  return new ApiError(404, message, "not_found");
}

export function unauthorized(message = "Nicht angemeldet") {
  return new ApiError(401, message, "unauthorized");
}

export function badRequest(message = "Ungültige Anfrage") {
  return new ApiError(400, message, "bad_request");
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "validation_error",
        message: "Die Eingaben sind ungültig.",
        issues: error.flatten()
      },
      { status: 422 }
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: error.status }
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: "internal_error", message: "Ein unerwarteter Fehler ist aufgetreten." },
    { status: 500 }
  );
}
