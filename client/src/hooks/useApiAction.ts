import { useCallback, useState } from "react";

// Wraps an API call so a failure shows the server's message instead of being
// swallowed as an unhandled rejection (the buttons used to just "do nothing"
// when the server rejected the request).
export function useApiAction() {
  const [error, setError] = useState("");
  const run = useCallback(async (fn: () => Promise<unknown>, fallback = "Something went wrong. Please try again.") => {
    setError("");
    try {
      await fn();
      return true;
    } catch (err: any) {
      setError(err?.response?.data?.message || fallback);
      return false;
    }
  }, []);
  return { error, run, clearError: () => setError("") };
}
