import axiosClient from "@/api/axiosClient"
import { api } from "@/api/api";


export const getResponses  = (params = {})           => axiosClient.get(`/soqm/responses`, {params})
export const getResponse  = (id)           => axiosClient.get(`/soqm/responses/${id}`,)
export const createResponse = (data) =>
  axiosClient.post("/soqm/responses/", data, {
    meta: {
      successMessage: "Response created successfully",
    },
  });



export const getRiskResponses = (params = {}) =>
  api.get("/soqm/responses", { params })



export const removeRiskFromResponse = (responseId, riskId) =>
  api.delete(`/soqm/responses/${responseId}/risks`, {
    data: { risk_id: riskId }, // axios needs `data` to send a body on DELETE
  })

export const fetchComponentRisks = async (componentId, { page = 1, size = 10 } = {}) => {
  const res = await api.get("/soqm/risks", {
    params: { component_id: componentId, page, size },
  })
  return res?.data ?? res // works with or without an unwrapping interceptor
}

export const addRiskToResponse = (responseId, riskId) =>
  api.post(`/soqm/responses/${responseId}/risks`, { risk_id: riskId })