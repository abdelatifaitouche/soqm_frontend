import axiosClient from "@/api/axiosClient"

export const getComponents  = ()           => axiosClient.get(`/components`)
export const getComponentsOptions  = ()           => axiosClient.get(`/components/options`)
export const getComponent   = (id)         => axiosClient.get(`/components/${id}`)
export const createComponent = (data)      => axiosClient.post(`/components/`, data)
export const updateComponent = (id, data)  => axiosClient.put(`/components/${id}/`, data)
export const deleteComponent = (id)        => axiosClient.delete(`/components/${id}/`)
export const getComponentObjectives = (id) => axiosClient.get(`/components/${id}/objectives`)