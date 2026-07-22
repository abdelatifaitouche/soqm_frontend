import { api } from "@/api/api";

// ===================== GET =====================

export const getComponents = () =>
  api.get("/components");

export const getComponentsOptions = () =>
  api.get("/components/options");

export const getComponent = (id) =>
  api.get(`/components/${id}`);

export const getComponentObjectives = (id) =>
  api.get(`/components/${id}/objectives`);

// ===================== CREATE =====================

export const createComponent = (data) =>
  api.post("/components/", data, {
    meta: {
      successMessage: "Component created successfully",
    },
  });

// ===================== UPDATE =====================

export const updateComponent = (id, data) =>
  api.patch(`/components/${id}/`, data, {
    meta: {
      successMessage: "Component updated successfully",
    },
  });

// ===================== DELETE =====================

export const deleteComponent = (id) =>
  api.delete(`/components/${id}/`, {
    meta: {
      successMessage: "Component deleted successfully",
    },
  });



export const activateComponent = (id) =>
  api.patch(`/components/${id}/activate/`, {
    meta: {
      successMessage: "Component activate successfully",
    },
  });


export const deactivateComponent = (id) =>
  api.patch(`/components/${id}/deactivate/`,  {
    meta: {
      successMessage: "Component deactivate successfully",
    },
  });


export const archiveComponent = (id) =>
  api.patch(`/components/${id}/archive/`,  {
    meta: {
      successMessage: "Component archived successfully",
    },
  });