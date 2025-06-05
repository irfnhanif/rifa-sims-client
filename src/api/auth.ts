import { apiClient } from "./client"

export const login = async (data) => {
    const response = await apiClient.post("/login")
}