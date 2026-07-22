import { api } from "@/api/api";

// ===================== GET =====================

export const getRisks = (params = {}) =>
  api.get("/risks", {
    params,
  });


export const getRiskMatrix = () => api.get("/risks/matrix/summary")


export const getRiskOptions = (params = {}) =>
  api.get("/risks/options", {
    params,
  });


export const getRisk = (id) =>
  api.get(`/risks/${id}`);

// ===================== CREATE =====================

export const createRisk = (data) =>
  api.post("/risks/", data, {
    meta: {
      successMessage: "Risk created successfully",
    },
  });

// ===================== UPDATE =====================

export const updateRisk = (id, data) =>
  api.patch(`/risks/${id}/`, data, {
    meta: {
      successMessage: "Risk updated successfully",
    },
  });

// ===================== DELETE =====================

export const deleteRisk = (id) =>
  api.delete(`/risks/${id}/`, {
    meta: {
      successMessage: "Risk deleted successfully",
    },
  });


export const getResponseRisks = (response_id) =>
  api.get(`/risks/${response_id}/list`);
