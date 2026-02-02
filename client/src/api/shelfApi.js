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

// Get cached book metadata from backend
export const getCachedBook = (openLibraryKey) => {
  // Extract just the key ID if it includes /works/ or /books/ prefix
  const keyId = openLibraryKey.split('/').pop();
  return API.get(`/books-cache/${keyId}`);
};
