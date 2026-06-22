import axiosClient from "../axiosClient";



export const getRisks  = (params = {}) => axiosClient.get("/risks", { params })
export const createRisk = (data) => axiosClient.post("/risks/" , data)
export const getRisk = (id) => axiosClient.get(`/risks/${id}`)
export const deleteRisk = (id) => axiosClient.delete(`/risks/${id}/`)
export const updateRisk = (id , data) => axiosClient.patch(`/risks/${id}/` , data)


