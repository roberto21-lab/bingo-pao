// Ajusta la URL base a la de tu API
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type CreateContactFormPayload = {
  title: string;
  description: string;
  email: string;
    user_id?: string;
};

export async function createContactFormService(payload: CreateContactFormPayload) {
  const response = await fetch(`${API_URL}/contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = "Error creando formulario";

    try {
      const data = await response.json();
      if (data?.message) errorMessage = data.message;
    } catch {
      // ignore
    }

    throw new Error(errorMessage);
  }

  return response.json();
}
