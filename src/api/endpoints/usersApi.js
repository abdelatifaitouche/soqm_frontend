import axiosClient from "@/api/axiosClient"

export const getUsers    = (page = 1)      => axiosClient.get(`/auth/list?page=${page}`)
export const getUser     = (id)            => axiosClient.get(`/auth/${id}/`)
export const createUser  = (data)          => axiosClient.post(`/auth/register/`, data)
export const updateUser  = (id, data)      => axiosClient.put(`/auth/${id}/`, data)
export const deleteUser  = (id)            => axiosClient.delete(`/auth/${id}/`)
export const getRoles    = ()              => axiosClient.get(`/auth/roles`)
export const getUserOptions    = ()              => axiosClient.get(`/auth/users/options`)

