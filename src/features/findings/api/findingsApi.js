import { api } from "@/api/api";


export const getFindings = (params = {}) =>
  api.get("/finding", {
    params,
  });


export const createFinding = (payload) =>
  api.post("/finding", payload)



export const getFindingById = (findingId) =>
  api.get(`/finding/${findingId}`)


export const startRootCauseAnalysis = (findingId, payload) =>
  api.patch(`/finding/${findingId}/root_cause_analyses`, payload)


export const updateFinding = (findingId, payload) =>
  api.patch(`/finding/${findingId}`, payload)