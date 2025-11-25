import { api } from "./api";

export type Status = {
  _id: string;
  name: string;
  category: string;
  created_at: string;
  updated_at: string;
};

/**
 * GET /statuses
 * Obtener todos los status
 */
export async function getStatuses(): Promise<Status[]> {
  const response = await api.get<Status[]>("/statuses");
  return response.data;
}

/**
 * Obtener el status por nombre y categoría
 */
export async function getStatusByNameAndCategory(name: string, category: string): Promise<Status | null> {
  const statuses = await getStatuses();
  return statuses.find(s => 
    s.name.toLowerCase() === name.toLowerCase() && 
    s.category.toLowerCase() === category.toLowerCase()
  ) || null;
}

