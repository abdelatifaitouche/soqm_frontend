import axiosClient from "../axiosClient";



export const getRisks  = (params = {}) => axiosClient.get("/risks", { params })
