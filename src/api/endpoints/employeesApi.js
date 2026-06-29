import { api } from "../api";

// ===================== GET =====================

export const getEmployees = (params = {}) => {
  // Build query params - only include non-empty values
  const queryParams = {
    page: params.page || 1,
  }
 
  // Add optional filters
  if (params.status) {
    queryParams.status = params.status
  }
  if (params.level) {
    queryParams.level = params.level
  }
 
  return api.get("/employee", { params: queryParams })
}

export const getEmployeeOptions = () =>
  api.get("/employee/options");

export const getMyProfile = () =>
  api.get("/profile/me");

export const getEmployee = (id) =>
  api.get(`/employee/${id}`);

// ===================== CREATE =====================

export const createEmployee = (data) =>
  api.post("/employee/", data, {
    meta: {
      successMessage: "employee created successfully",
    },
  });

