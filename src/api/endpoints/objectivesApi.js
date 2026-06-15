import axiosClient from "../axiosClient";

export const getObjectives = () =>  axiosClient.get("/objectives")
export const getObjective = (id) => axiosClient.get(`/objectives/${id}`)
export const createObjective = (data) => axiosClient.post("/objectives/" , data)
export const updateObjective = (id, data) => axiosClient.patch(`/objectives/${id}/`, data)
export const deleteObjective = (id)       => axiosClient.delete(`/objectives/${id}/`)
