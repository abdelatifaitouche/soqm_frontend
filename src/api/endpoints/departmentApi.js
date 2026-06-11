import axiosClient from "@/api/axiosClient"

export const getDepts    = ()      => axiosClient.get(`/organization/departments`)
export const getDept    = (id)            => axiosClient.get(`/organization/departments/${id}/`)
export const createDept  = (data)          => axiosClient.post(`/organization/departments/`, data)
export const getDeptTree    = ()          => axiosClient.get(`/api/v1/departments/tree/`)
export const updateDept     = (id, data)  => axiosClient.put(`/api/v1/departments/${id}/`, data)
export const deleteDept     = (id)        => axiosClient.delete(`/api/v1/departments/${id}/`)