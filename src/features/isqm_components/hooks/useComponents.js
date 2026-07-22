import { useState, useEffect } from "react";
import { api } from "@/api/api";
export function useComponents() {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComponents = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.get("/components");
      setComponents(data);
    } catch (err) {
      setError(err); // optional (UI-level handling only)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  return {
    components,
    setComponents,
    loading,
    error,
    refetch: fetchComponents,
  };
}