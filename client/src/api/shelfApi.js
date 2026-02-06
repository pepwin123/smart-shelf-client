import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const getShelf = (workspaceId) =>
  API.get(`/shelves/${workspaceId}`);

export const moveBook = (id, data) =>
  API.patch(`/shelves/${id}/move`, data);

export const addBook = (data) =>
  API.post("/shelves", data);
