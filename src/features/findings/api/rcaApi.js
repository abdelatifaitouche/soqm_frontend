import { api } from "@/api/api";


export const getRca = () =>
  api.get("/rca_tracker");



// this one is workign but its not returning the correct thing, fix later
export const seedRca = (file) => {
  const form = new FormData()
  // Ensure "file" matches the exact key name in your FastAPI route parameter
  form.append("file", file) 

  return api.post("/rca_tracker/seed", form, {
    headers: {
      // Setting this to null/undefined forces Axios to drop any global JSON defaults 
      // and correctly compute the dynamic multipart/form-data boundary
      "Content-Type": undefined, 
    }
  })
}