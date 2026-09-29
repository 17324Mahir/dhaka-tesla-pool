import { ErrorRequestHandler } from "express";

const getStatus = (error: unknown): number | undefined => {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }

  return undefined;
};

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
): void => {
  const status = getStatus(error);

  if (error instanceof SyntaxError && status === 400) {
    res.status(400).json({ message: "Request body contains invalid JSON" });
    return;
  }

  if (status === 413) {
    res.status(413).json({ message: "Request body is too large" });
    return;
  }

  console.error("Unhandled request error:", error);
  res.status(500).json({ message: "Internal server error" });
};
