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
  api.post("/soqm/objectives", data, {
    meta: {
      successMessage: "Objective created successfully",
    },
  });

// ===================== UPDATE =====================

export const updateObjective = (id, data) =>
  api.patch(`/soqm/objectives/${id}`, data, {
    meta: {
      successMessage: "Objective updated successfully",
    },
  });

// ===================== DELETE =====================

export const deleteObjective = (id) =>
  api.delete(`/soqm/objectives/${id}`, {
    meta: {
      successMessage: "Objective deleted successfully",
    },
  });



export const linkRiskToObjective = (riskId, objectiveId) =>
  api.post(`/soqm/risks/${riskId}/objectives`, { objective_id: objectiveId })

export const unlinkRiskFromObjective = (riskId, objectiveId) =>
  api.delete(`/soqm/risks/${riskId}/objectives`, { data: { objective_id: objectiveId } })

export const getComponentRisks = async (componentId, { page = 1, size = 10 } = {}) => {
  const res = await api.get("/soqm/risks", { params: { component_id: componentId, page, size } })
  return res?.data ?? res // works with or without an unwrapping interceptor
}