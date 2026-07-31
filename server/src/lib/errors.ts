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

export class CircuitOpenError extends AppError {
  constructor(integration: string) {
    super(`[${integration}] circuit breaker is open`, 503, "CIRCUIT_OPEN");
  }
}
