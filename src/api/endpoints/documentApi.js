import { api } from "../api";

// ===================== GET =====================

export const getDocuments = (params = {}) =>
  api.get("/documents", {
    params,
  });



export const downloadDocument = (id) =>
  api.get(`/documents/${id}/download`, {
    responseType: "blob",
  });


  
export const uploadDocument = (file, { title, description, document_type }, config = {}) => {
  const formData = new FormData()
  formData.append("file", file)
 
  return api.post("/documents/upload/", formData, {
    params: { title, description, document_type },
    headers: { "Content-Type": "multipart/form-data" },
    ...config,
  })
}