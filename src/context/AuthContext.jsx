import { createContext, useState, useEffect, useCallback } from "react"
import axiosClient, { setAuthInterceptors } from "@/api/axiosClient"
import { getToken, saveToken, removeToken, decodeToken } from "@/utils/tokenUtils"

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Initialize user directly from localStorage token — survives page refresh
  const [user, setUser] = useState(() => {
    const token = getToken()
    return token ? decodeToken(token) : null
  })

  const logout = useCallback(() => {
    removeToken()
    setUser(null)
  }, [])

  const refreshToken = useCallback(async () => {
    const response = await axiosClient.post("/auth/refresh/")
    const { access_token } = response.data
    saveToken(access_token)
    setUser(decodeToken(access_token))
    return access_token
  }, [])

  // Attach interceptors once on mount
  useEffect(() => {
    setAuthInterceptors(refreshToken, logout)
  }, [refreshToken, logout])

  const login = async (email, password) => {
    const response = await axiosClient.post("/auth/login/", { email, password })
    const { access_token } = response.data
    saveToken(access_token)
    setUser(decodeToken(access_token))
  }

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}