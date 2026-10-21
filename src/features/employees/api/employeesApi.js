import { api } from "@/api/api";

// ===================== GET =====================
export const getEmployees = (params = {}) => {
  const query = Object.fromEntries(
    Object.entries({ page: 1, size: 10, ...params }).filter(([, v]) => v !== "" && v != null)
  )
  return api.get("/org/employee", { params: query })
}

export const getEmployeeOptions = () =>
  api.get("/org/employee/employees/options");

export const getMyProfile = () =>
  api.get("/org/profile/me");

export const getEmployee = (id) =>
  api.get(`/org/employee/${id}`);

// ===================== CREATE =====================

export const createEmployee = (data) =>
  api.post("/org/employee", data, {
    meta: {
      successMessage: "employee created successfully",
    },
  });



  export const updateEmployee = (id, data) =>
  api.patch(`/org/employee/${id}`, data, { meta: { successMessage: "Employee updated" } })

export const blockEmployee = (id) =>
  api.post(`/org/employee/${id}/block`, null, { meta: { successMessage: "Employee blocked" } })

export const activateEmployee = (id) =>
  api.post(`/org/employee/${id}/activate`, null, { meta: { successMessage: "Employee activated" } })
