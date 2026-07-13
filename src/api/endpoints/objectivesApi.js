import { api } from "../api";
// ===================== GET =====================

export const getObjectives = (params = {}) =>
  api.get("/objectives", { params })

export const getObjectivesOptions = (params = {}) =>
  api.get("/objectives/options", {
    params,
  });

export const getObjective = (id) =>
  api.get(`/objectives/${id}`);

export const getObjectiveRisks = (id, params = {}) =>
  api.get(`/risks/objective/${id}/risks`, { params })
// ===================== CREATE =====================

export const createObjective = (data) =>
  api.post("/objectives/", data, {
    meta: {
      successMessage: "Objective created successfully",
    },
  });

// ===================== UPDATE =====================

export const updateObjective = (id, data) =>
  api.patch(`/objectives/${id}/`, data, {
    meta: {
      successMessage: "Objective updated successfully",
    },
  });

// ===================== DELETE =====================

export const deleteObjective = (id) =>
  api.delete(`/objectives/${id}/`, {
    meta: {
      successMessage: "Objective deleted successfully",
    },
  });