import { apiRequest } from "./queryClient";

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  message: string;
  admin: {
    id: number;
    username: string;
    email: string;
  };
}

export async function loginAdmin(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiRequest("POST", "/api/admin/login", credentials);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Login failed");
  }
  
  return response.json();
}

export async function logoutAdmin(): Promise<void> {
  const response = await apiRequest("POST", "/api/admin/logout");
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Logout failed");
  }
}

export async function checkAdminStatus(): Promise<{ isAdmin: boolean; username?: string }> {
  const response = await apiRequest("GET", "/api/admin/check");
  return response.json();
}
