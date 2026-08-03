import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";

export function createHttpClient(baseURL: string, defaultHeaders: Record<string, string> = {}): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 15_000,
    headers: defaultHeaders,
  });

  axiosRetry(client, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) =>
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status !== undefined && error.response.status >= 500),
  });

  return client;
}
