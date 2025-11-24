import { api } from "./api";

export type DocumentType = {
  _id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export async function getDocumentTypes(activeOnly: boolean = true): Promise<DocumentType[]> {
  const { data } = await api.get<{ success: boolean; data: DocumentType[] }>(
    `/document-types?active_only=${activeOnly}`
  );
  if (data?.success && data?.data) return data.data;
  return [];
}

export async function getDocumentTypeById(id: string): Promise<DocumentType | null> {
  try {
    const { data } = await api.get<{ success: boolean; data: DocumentType }>(
      `/document-types/${id}`
    );
    if (data?.success && data?.data) return data.data;
    return null;
  } catch (error) {
    console.error("Error al obtener tipo de documento:", error);
    return null;
  }
}

