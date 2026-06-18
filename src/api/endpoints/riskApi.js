import axiosClient from "../axiosClient";



export const getRisks = () => axiosClient.get("/risks")