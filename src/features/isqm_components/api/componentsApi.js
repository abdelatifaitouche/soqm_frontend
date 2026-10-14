import { api } from "@/api/api";

// ===================== GET =====================

export const getComponents = () =>
  api.get("/soqm/components");

export const getComponentsOptions = () =>
  api.get("/soqm/components/options");

export const getComponent = (id) =>
  api.get(`/soqm/components/${id}`);

export const getComponentObjectives = (id) =>
  api.get(`/soqm/components/${id}/objectives`);

// ===================== CREATE =====================

export const createComponent = (data) =>
  api.post("/soqm/components/", data, {
    meta: {
      successMessage: "Component created successfully",
    },
  });

// ===================== UPDATE =====================

export const updateComponent = (id, data) =>
  api.patch(`/soqm/components/${id}/`, data, {
    meta: {
      successMessage: "Component updated successfully",
    },
  });

// ===================== DELETE =====================

export const deleteComponent = (id) =>
  api.delete(`/soqm/components/${id}/`, {
    meta: {
      successMessage: "Component deleted successfully",
    },
  });



export const activateComponent = (id) =>
  api.patch(`/soqm/components/${id}/activate/`, {
    meta: {
      successMessage: "Component activate successfully",
    },
  });


export const deactivateComponent = (id) =>
  api.patch(`/soqm/components/${id}/deactivate/`,  {
    meta: {
      successMessage: "Component deactivate successfully",
    },
  });


export const archiveComponent = (id) =>
  api.patch(`/soqm/components/${id}/archive/`,  {
    meta: {
      successMessage: "Component archived successfully",
    },
  });