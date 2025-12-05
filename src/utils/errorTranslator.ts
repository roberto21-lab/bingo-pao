export function translateError(error: unknown, defaultMessage: string): string {
  if (error && typeof error === "object") {
    if ("response" in error) {
      const httpError = error as { response?: { data?: { message?: string }; status?: number } };
      const msg = httpError.response?.data?.message;
      
      if (msg) {
        if (msg.includes("Network Error") || msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND")) {
          return "Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.";
        }
        if (msg.includes("404") || msg.includes("Not Found")) {
          return "No se encontró el recurso solicitado.";
        }
        if (msg.includes("500") || msg.includes("Internal Server Error")) {
          return "Error del servidor. Por favor, intenta nuevamente más tarde.";
        }
        if (msg.includes("Error") || msg.includes("error") || msg.includes("conexión") || msg.includes("servidor")) {
          return msg;
        }
      }
    }
    
    if ("message" in error) {
      const msg = String(error.message);
      if (msg.includes("Network Error") || msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND")) {
        return "Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.";
      }
      if (msg.includes("404") || msg.includes("Not Found")) {
        return "No se encontró el recurso solicitado.";
      }
      if (msg.includes("500") || msg.includes("Internal Server Error")) {
        return "Error del servidor. Por favor, intenta nuevamente más tarde.";
      }
      if (msg.includes("Error") || msg.includes("error") || msg.includes("conexión") || msg.includes("servidor")) {
        return msg;
      }
    }
  }
  
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("Network Error") || msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND")) {
      return "Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.";
    }
    if (msg.includes("404") || msg.includes("Not Found")) {
      return "No se encontró el recurso solicitado.";
    }
    if (msg.includes("500") || msg.includes("Internal Server Error")) {
      return "Error del servidor. Por favor, intenta nuevamente más tarde.";
    }
    if (msg.includes("Error") || msg.includes("error") || msg.includes("conexión") || msg.includes("servidor")) {
      return msg;
    }
  }
  
  return defaultMessage;
}

export function translateActiveRoomsError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = String(error.message);
    if (msg.includes("Error") || msg.includes("error") || msg.includes("conexión") || msg.includes("servidor")) {
      return msg;
    }
    if (msg.includes("Network Error") || msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND")) {
      return "Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.";
    }
    if (msg.includes("404") || msg.includes("Not Found")) {
      return "No se encontraron salas activas.";
    }
    if (msg.includes("500") || msg.includes("Internal Server Error")) {
      return "Error del servidor. Por favor, intenta nuevamente más tarde.";
    }
    return `Error al cargar las partidas: ${msg}`;
  }
  return "Error al cargar las partidas activas. Por favor, intenta nuevamente.";
}
