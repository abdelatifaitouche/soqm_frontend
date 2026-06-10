import axiosClient from "@/api/axiosClient"

export const getComponents = () => axiosClient.get("/components")