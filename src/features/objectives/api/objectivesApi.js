import { api } from "@/api/api";
// ===================== GET =====================

export const getObjectives = (params = {}) =>
  api.get("/soqm/objectives", { params })

export const getObjectivesOptions = (params = {}) =>
  api.get("/soqm/objectives/options", {
    params,
  });

export const getObjective = (id) =>
  api.get(`/soqm/objectives/${id}`);

export const getObjectiveRisks = (id, params = {}) =>
  api.get("/soqm/risks", {
    params: {
      ...params,
      objective_id: id,
    },
  })
// ===================== CREATE =====================

export const createObjective = (data) =>
  api.post("/soqm/objectives/", data, {
    meta: {
      successMessage: "Objective created successfully",
    },
  });

// ===================== UPDATE =====================

export const updateObjective = (id, data) =>
  api.patch(`/soqm/objectives/${id}/`, data, {
    meta: {
      successMessage: "Objective updated successfully",
    },
  });

// ===================== DELETE =====================

export const deleteObjective = (id) =>
  api.delete(`/soqm/objectives/${id}/`, {
    meta: {
      successMessage: "Objective deleted successfully",
    },
  });