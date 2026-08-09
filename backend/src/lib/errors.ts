export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly issues?: unknown) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class IntegrationFetchError extends AppError {
  constructor(integration: string, message: string) {
    super(`[${integration}] fetch failed: ${message}`, 502, "INTEGRATION_FETCH_ERROR");
  }
}

/**
 * Raised when an integration cannot run because it is not configured (e.g. a
 * missing API key). Distinct from a fetch failure so the orchestrator can treat
 * it as a skipped/degraded sync rather than a hard failure — no sync-failure
 * alert is fired for an integration that was simply never set up.
 */
export class IntegrationNotConfiguredError extends AppError {
  constructor(integration: string, message: string) {
    super(`[${integration}] not configured: ${message}`, 501, "INTEGRATION_NOT_CONFIGURED");
  }
}

export class CircuitOpenError extends AppError {
  constructor(integration: string) {
    super(`[${integration}] circuit breaker is open`, 503, "CIRCUIT_OPEN");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, 403, "FORBIDDEN");
  }
}
