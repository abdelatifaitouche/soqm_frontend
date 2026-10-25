import { api } from "@/api/api";

// ===================== GET =====================

export const getRisks = (params = {}) =>
  api.get("/soqm/risks", {
    params,
  });


export const getRiskMatrix = (componentId) =>
  api.get("/soqm/risks/matrix/summary", {
    params: componentId ? { component_id: componentId } : {},
  })

export const getRiskOptions = (params = {}) =>
  api.get("/risks/options", {
    params,
  });


export const getRisk = (id) =>
  api.get(`/soqm/risks/${id}`);

// ===================== CREATE =====================

export const createRisk = (data) =>
  api.post("/soqm/risks", data, {
    meta: {
      successMessage: "Risk created successfully",
    },
  });

// ===================== UPDATE =====================

export const updateRisk = (id, data) =>
  api.patch(`/soqm/risks/${id}`, data, {
    meta: {
      successMessage: "Risk updated successfully",
    },
  });

// ===================== DELETE =====================

export const deleteRisk = (id) =>
  api.delete(`/soqm/risks/${id}`, {
    meta: {
      successMessage: "Risk deleted successfully",
    },
  });

export const getResponseRisks = (response_id) =>
  api.get("/soqm/risks", {
    params: { response_id },
  });


  const RISK_RESPONSES_PATH = (riskId) => `/soqm/risks/${riskId}/responses`



export async function fetchComponentResponses(
  componentId,
  { page = 1, size = 10 } = {}
) {
  return api.get("/soqm/responses", {
    params: {
      component_id: componentId,
      page,
      size,
    },
  })
}

export async function addResponseToRisk(riskId, responseId) {
  const { data } = await api.post(RISK_RESPONSES_PATH(riskId), { response_id: responseId })
  return data
}

export async function removeResponseFromRisk(riskId, responseId) {
  // axios sends a DELETE body via `data`
  const { data } = await api.delete(RISK_RESPONSES_PATH(riskId), { data: { response_id: responseId } })
  return data
}



export const addObjectiveToRisk = (riskId, objectiveId) =>
  api.post(`/soqm/risks/${riskId}/objectives`, { objective_id: objectiveId })

export const removeObjectiveFromRisk = (riskId, objectiveId) =>
  api.delete(`/soqm/risks/${riskId}/objectives`, { data: { objective_id: objectiveId } })

export const fetchComponentObjectives = async (componentId, { page = 1, size = 10 } = {}) => {
  const res = await api.get("/soqm/objectives", { params: { component_id: componentId, page, size } })
  return res?.data ?? res
}



export const fetchRiskReasonCategories = async () => {
  const res = await api.get("/soqm/risks/reason_categories")
  return res?.data ?? res // works with or without an unwrapping interceptor
}

export const closeRisk = (riskId, payload) =>
  api.post(`/soqm/risks/${riskId}/close`, payload, {
    meta: { successMessage: "Risk voided" },
  })