import { api } from "@/api/api";

// ===================== GET =====================

export const getDepts = () =>
  api.get("/organization/departments");

export const getDept = (id) =>
  api.get(`/organization/departments/${id}/`);

export const getDeptTree = () =>
  api.get("/api/v1/departments/tree/");

// ===================== CREATE =====================

export const createDept = (data) =>
  api.post("/organization/departments/", data, {
    meta: {
      successMessage: "Department created successfully",
    },
  });

// ===================== UPDATE =====================

export const updateDept = (id, data) =>
  api.put(`/api/v1/departments/${id}/`, data, {
    meta: {
      successMessage: "Department updated successfully",
    },
  });

// ===================== DELETE =====================

export const deleteDept = (id) =>
  api.delete(`/api/v1/departments/${id}/`, {
    meta: {
      successMessage: "Department deleted successfully",
    },
  });