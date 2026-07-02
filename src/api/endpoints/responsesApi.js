import axiosClient from "@/api/axiosClient"


export const getResponses  = (params = {})           => axiosClient.get(`/responses`, {params})
export const getResponse  = (id)           => axiosClient.get(`/responses/${id}`,)
export const createResponse = (data) =>
  axiosClient.post("/responses/", data, {
    meta: {
      successMessage: "Response created successfully",
    },
  });
