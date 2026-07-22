import axiosClient from "@/api/axiosClient"
import { api } from "@/api/api";


export const getResponses  = (params = {})           => axiosClient.get(`/responses`, {params})
export const getResponse  = (id)           => axiosClient.get(`/responses/${id}`,)
export const createResponse = (data) =>
  axiosClient.post("/responses/", data, {
    meta: {
      successMessage: "Response created successfully",
    },
  });


export const getRiskResponses = (id , params = {}) => api.get(`/responses/${id}/responses`, {params})