import { api } from "./api";

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  document_type_id?: string;
  document_number?: string;
  phone?: string;
  address?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role_id?: any;
  profile?: {
    _id: string;
    document_type_id: any;
    document_number: string;
    phone?: string;
    address?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await api.post<{ success: boolean; data: User; message?: string }>(
    "/users",
    payload
  );
  if (data?.success && data?.data) return data.data;
  // si el backend llega a devolver solo message
  throw new Error(data?.message || "No se pudo crear el usuario");
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    if (!userId || userId.trim() === "") {
      throw new Error("ID de usuario inválido");
    }

    console.log("📡 Haciendo petición GET a:", `/users/${userId}`);
    const response = await api.get<{ success: boolean; data: User }>(
      `/users/${userId}`
    );
    
    console.log("📥 Respuesta del servidor:", {
      status: response.status,
      success: response.data?.success,
      hasData: !!response.data?.data,
    });
    
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    
    // Si la respuesta no tiene success: true o data, lanzar error
    throw new Error("No se pudo obtener la información del usuario");
  } catch (error: any) {
    console.error("❌ Error al obtener usuario:", error);
    console.error("📋 Detalles del error:", {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
      url: error?.config?.url,
    });
    
    // Si es un error 404, lanzar un error más específico
    if (error?.response?.status === 404) {
      const backendMessage = error?.response?.data?.message || "Usuario no encontrado";
      throw new Error(`${backendMessage}. El ID usado fue: ${userId}`);
    }
    
    // Si es un error 400 (ID inválido), lanzar error específico
    if (error?.response?.status === 400) {
      throw new Error("ID de usuario inválido");
    }
    
    // Para otros errores, lanzar el mensaje del servidor o un mensaje genérico
    throw new Error(
      error?.response?.data?.message || 
      error?.message || 
      "Error al obtener la información del usuario"
    );
  }
}

