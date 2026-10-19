import { useCallback, useState } from "react";
import {
  startAction,
  completeAction,
  updateAction,
} from "@/features/findings/api/actionsApi";

function useActionMutation(mutationFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);

      try {
        const response = await mutationFn(...args);

        // Works with both JSON responses and HTTP 200 with no body.
        return response?.data ?? null;
      } catch (err) {
        const detail =
          err.response?.data?.detail ??
          err.response?.data?.message;

        const message =
          (typeof detail === "string" && detail) ||
          err.message ||
          "Something went wrong.";

        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn]
  );

  return { mutate, loading, error, setError };
}

export function useStartAction() {
  return useActionMutation(startAction);
}

export function useCompleteAction() {
  return useActionMutation(completeAction);
}

export function useUpdateAction() {
  return useActionMutation(updateAction);
}