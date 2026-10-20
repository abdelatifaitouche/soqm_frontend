import { api } from "@/api/api";

export const getActions = (params = {}) =>
  api.get("/action", {
    params,
  });

export const getFindingActions = (findingId, params = {}) =>
  api.get(`/finding/${findingId}/actions`, {
    params,
  });

export const createAction = (findingId, payload) =>
  api.post(`/finding/${findingId}/actions`, payload);

export const getActionDetails = (actionId) =>
  api.get(`/action/${actionId}`);

export const startAction = (actionId) =>
  api.post(`/action/${actionId}/start`);

export const completeAction = (actionId) =>
  api.post(`/action/${actionId}/complete`);

export const updateAction = (actionId, payload) =>
  api.patch(`/action/${actionId}`, payload);


export const deleteAction = (actionId) => api.delete(`/action/${actionId}`)