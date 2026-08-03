import CircuitBreaker from "opossum";
import { CircuitOpenError } from "../../lib/errors";
import { logger } from "../../lib/logger";

const breakers = new Map<string, CircuitBreaker>();

/**
 * One circuit breaker per integration, wrapping its raw fetch function. When
 * the breaker is open, calls fail fast with CircuitOpenError instead of
 * piling up against a service that's already failing.
 */
export function getCircuitBreaker<T extends unknown[], R>(
  integration: string,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  let breaker = breakers.get(integration) as CircuitBreaker<T, R> | undefined;

  if (!breaker) {
    breaker = new CircuitBreaker(fn, {
      timeout: 20_000,
      errorThresholdPercentage: 50,
      resetTimeout: 30_000,
      rollingCountTimeout: 60_000,
      name: integration,
    });

    breaker.on("open", () => logger.warn({ integration }, "circuit breaker opened"));
    breaker.on("halfOpen", () => logger.info({ integration }, "circuit breaker half-open"));
    breaker.on("close", () => logger.info({ integration }, "circuit breaker closed"));

    breakers.set(integration, breaker as CircuitBreaker);
  }

  return async (...args: T) => {
    if (breaker!.opened) {
      throw new CircuitOpenError(integration);
    }
    return breaker!.fire(...args);
  };
}

export function getCircuitBreakerStates(): Record<string, "open" | "closed" | "halfOpen"> {
  const states: Record<string, "open" | "closed" | "halfOpen"> = {};
  for (const [name, breaker] of breakers.entries()) {
    states[name] = breaker.opened ? "open" : breaker.halfOpen ? "halfOpen" : "closed";
  }
  return states;
}
