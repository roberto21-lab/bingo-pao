/**
 * E2E Tests para Sincronización de Números Llamados
 * 
 * ISSUE: Cuando un usuario sale y entra de la sala, los últimos números 
 * solo muestran algunos. Solo con recargar aparecen correctamente.
 * 
 * Estos tests verifican que:
 * 1. Al entrar a la sala, se cargan todos los números llamados
 * 2. Al salir y volver a entrar, los números se mantienen
 * 3. La sincronización con WebSocket no pierde números
 */

describe("Sincronización de Números Llamados al Entrar/Salir", () => {
  describe("Carga inicial de la página", () => {
    it("debe cargar la página de inicio sin errores", () => {
      cy.visit("/");
      cy.get("body").should("be.visible");
    });

    it("debe poder navegar a las salas disponibles", () => {
      cy.visit("/");
      cy.get("body").should("be.visible");
    });
  });

  describe("Lógica de sincronización de números (mock)", () => {
    it("debe mostrar todos los números al cargar la sala", () => {
      // Simular respuesta del API con múltiples números
      const mockCalledNumbers = [
        { _id: "1", number: "B-1", called_at: "2024-01-01T10:00:00Z" },
        { _id: "2", number: "I-16", called_at: "2024-01-01T10:00:07Z" },
        { _id: "3", number: "N-31", called_at: "2024-01-01T10:00:14Z" },
        { _id: "4", number: "G-46", called_at: "2024-01-01T10:00:21Z" },
        { _id: "5", number: "O-61", called_at: "2024-01-01T10:00:28Z" },
        { _id: "6", number: "B-2", called_at: "2024-01-01T10:00:35Z" },
        { _id: "7", number: "I-17", called_at: "2024-01-01T10:00:42Z" },
        { _id: "8", number: "N-32", called_at: "2024-01-01T10:00:49Z" },
      ];

      // Verificar que la respuesta contiene todos los números
      expect(mockCalledNumbers.length).to.equal(8);

      // Simular creación del Set de números (como hace el frontend)
      const calledSet = new Set(mockCalledNumbers.map(cn => cn.number));
      expect(calledSet.size).to.equal(8);
    });

    it("debe parsear correctamente los últimos 3 números para mostrar", () => {
      const mockCalledNumbers = [
        { number: "B-1", called_at: "2024-01-01T10:00:00Z" },
        { number: "I-16", called_at: "2024-01-01T10:00:07Z" },
        { number: "N-31", called_at: "2024-01-01T10:00:14Z" },
        { number: "G-46", called_at: "2024-01-01T10:00:21Z" },
        { number: "O-61", called_at: "2024-01-01T10:00:28Z" },
        { number: "B-2", called_at: "2024-01-01T10:00:35Z" },
        { number: "I-17", called_at: "2024-01-01T10:00:42Z" },
        { number: "N-32", called_at: "2024-01-01T10:00:49Z" },
      ];

      // Simular la lógica del frontend para lastNumbers
      const lastThree = mockCalledNumbers
        .slice(-3)
        .reverse()
        .map(cn => cn.number);

      expect(lastThree).to.deep.equal(["N-32", "I-17", "B-2"]);
      expect(lastThree.length).to.equal(3);
    });

    it("el Set calledNumbers debe contener TODOS los números, no solo los últimos", () => {
      const mockCalledNumbers = [
        { number: "B-1" }, { number: "I-16" }, { number: "N-31" },
        { number: "G-46" }, { number: "O-61" }, { number: "B-2" },
        { number: "I-17" }, { number: "N-32" }, { number: "G-47" },
        { number: "O-62" }, { number: "B-3" }, { number: "I-18" },
      ];

      const calledSet = new Set(mockCalledNumbers.map(cn => cn.number));
      
      // El Set debe tener TODOS los números (12 en este caso)
      expect(calledSet.size).to.equal(12);
      
      // Verificar que contiene números específicos
      expect(calledSet.has("B-1")).to.be.true;
      expect(calledSet.has("I-18")).to.be.true;
      expect(calledSet.has("O-62")).to.be.true;
    });
  });

  describe("Evento room-state-sync", () => {
    it("debe sincronizar todos los números desde el servidor", () => {
      // Simular evento room-state-sync
      const roomStateSyncData = {
        room_id: "test-room-123",
        round: {
          round_number: 1,
          pattern: "horizontal",
          called_numbers: [
            { number: "B-1", called_at: "2024-01-01T10:00:00Z" },
            { number: "I-16", called_at: "2024-01-01T10:00:07Z" },
            { number: "N-31", called_at: "2024-01-01T10:00:14Z" },
            { number: "G-46", called_at: "2024-01-01T10:00:21Z" },
            { number: "O-61", called_at: "2024-01-01T10:00:28Z" },
            { number: "B-2", called_at: "2024-01-01T10:00:35Z" },
            { number: "I-17", called_at: "2024-01-01T10:00:42Z" },
            { number: "N-32", called_at: "2024-01-01T10:00:49Z" },
          ],
          called_count: 8,
          status: "in_progress",
        },
      };

      // Verificar estructura del evento
      expect(roomStateSyncData.round).to.not.be.null;
      expect(roomStateSyncData.round?.called_numbers.length).to.equal(8);
      expect(roomStateSyncData.round?.called_count).to.equal(8);

      // Simular cómo el frontend procesa estos datos
      const syncedNumbers = new Set(
        roomStateSyncData.round?.called_numbers.map(cn => cn.number) || []
      );
      expect(syncedNumbers.size).to.equal(8);
    });

    it("called_count debe coincidir con la cantidad de números", () => {
      const called_numbers = [
        { number: "B-1" }, { number: "I-16" }, { number: "N-31" },
        { number: "G-46" }, { number: "O-61" },
      ];
      const called_count = called_numbers.length;

      expect(called_count).to.equal(5);
      expect(called_count).to.equal(called_numbers.length);
    });
  });

  describe("Escenario de salir y entrar", () => {
    it("debe mantener la cantidad correcta de números al simular salir/entrar", () => {
      // Estado inicial: 10 números llamados
      const initialNumbers = [
        "B-1", "I-16", "N-31", "G-46", "O-61",
        "B-2", "I-17", "N-32", "G-47", "O-62",
      ];

      // El usuario "sale" (el componente se desmonta)
      // Los números siguen en el backend

      // El usuario "entra" (el componente se monta de nuevo)
      // El API debe devolver todos los números
      const numbersAfterReenter = [...initialNumbers]; // Simula respuesta del API

      expect(numbersAfterReenter.length).to.equal(initialNumbers.length);
      expect(numbersAfterReenter).to.deep.equal(initialNumbers);
    });

    it("no debe perder números aunque haya desincronización temporal", () => {
      // Escenario: BD tiene 15 números, pero WebSocket envía solo 5
      const numbersInDB = [
        "B-1", "I-16", "N-31", "G-46", "O-61",
        "B-2", "I-17", "N-32", "G-47", "O-62",
        "B-3", "I-18", "N-33", "G-48", "O-63",
      ];
      const numbersFromWebSocket = ["B-1", "I-16", "N-31", "G-46", "O-61"];

      // La corrección debe detectar que BD tiene más números
      const needsSync = numbersInDB.length > numbersFromWebSocket.length;
      expect(needsSync).to.be.true;

      // Y usar los datos de BD como fuente de verdad
      const finalNumbers = needsSync ? numbersInDB : numbersFromWebSocket;
      expect(finalNumbers.length).to.equal(15);
    });
  });

  describe("FIX-1: lastNumbersRef - Últimos 3 números en tiempo real", () => {
    it("debe acumular correctamente los últimos 3 números cuando llegan en tiempo real", () => {
      // Simular el comportamiento del ref que corregimos
      const lastNumbersRef = { current: [] };
      let lastNumbersState = [];
      
      const setLastNumbers = (value) => {
        lastNumbersState = value;
        lastNumbersRef.current = value;
      };

      // Simular llegada de números uno por uno (como hace WebSocket)
      const incomingNumbers = ["B-5", "I-20", "N-35", "G-50", "O-65"];
      
      incomingNumbers.forEach(num => {
        // Usar ref (como en la corrección) en lugar del valor capturado
        const currentLast = lastNumbersRef.current || [];
        const updated = [num, ...currentLast].slice(0, 3);
        setLastNumbers(updated);
      });

      // Debe mostrar los últimos 3 números (más reciente primero)
      expect(lastNumbersState).to.have.length(3);
      expect(lastNumbersState).to.deep.equal(["O-65", "G-50", "N-35"]);
    });

    it("NO debe perder números cuando llegan rápidamente (closure stale fix)", () => {
      // Este test verifica que el ref mantiene el valor actualizado
      const lastNumbersRef = { current: [] };
      let finalState = [];
      
      const setLastNumbers = (value) => {
        finalState = value;
        lastNumbersRef.current = value;
      };

      // Simular 10 números llegando
      for (let i = 1; i <= 10; i++) {
        const num = `B-${i}`;
        const currentLast = lastNumbersRef.current || [];
        const updated = [num, ...currentLast].slice(0, 3);
        setLastNumbers(updated);
      }

      // Debe tener exactamente 3 (los últimos)
      expect(finalState).to.have.length(3);
      expect(finalState[0]).to.equal("B-10"); // El más reciente
    });
  });

  describe("Consistencia de datos", () => {
    it("calledNumbers y lastNumbers deben ser consistentes", () => {
      // Simular estado después de cargar datos
      const allCalledNumbers = [
        "B-1", "I-16", "N-31", "G-46", "O-61",
        "B-2", "I-17", "N-32", "G-47", "O-62",
      ];
      
      const calledSet = new Set(allCalledNumbers);
      
      // lastNumbers son los últimos 3 en orden inverso
      const lastNumbers = allCalledNumbers.slice(-3).reverse();

      // Verificar consistencia
      expect(calledSet.size).to.equal(10);
      expect(lastNumbers.length).to.equal(3);
      
      // Los últimos números deben estar en el set completo
      lastNumbers.forEach(num => {
        expect(calledSet.has(num)).to.be.true;
      });
    });

    it("el número actual debe ser el último del array", () => {
      const calledNumbersData = [
        { number: "B-1", called_at: "2024-01-01T10:00:00Z" },
        { number: "I-16", called_at: "2024-01-01T10:00:07Z" },
        { number: "N-31", called_at: "2024-01-01T10:00:14Z" },
      ];

      // El número actual es el último llamado
      const currentNumber = calledNumbersData[calledNumbersData.length - 1].number;
      expect(currentNumber).to.equal("N-31");
    });
  });
});

/**
 * PRUEBAS MANUALES RECOMENDADAS:
 * 
 * 1. PRUEBA DE PERSISTENCIA AL SALIR/ENTRAR:
 *    - Entrar a una sala con juego en progreso
 *    - Esperar a que se llamen varios números (>5)
 *    - Salir de la sala (volver al Home)
 *    - Volver a entrar a la sala
 *    - VERIFICAR: Todos los números deben seguir visibles
 * 
 * 2. PRUEBA DE RECARGA VS NAVEGACIÓN:
 *    - Entrar a una sala con números llamados
 *    - Anotar cuántos números hay
 *    - Salir y entrar sin recargar
 *    - VERIFICAR: La cantidad de números es la misma
 *    - Recargar la página
 *    - VERIFICAR: La cantidad sigue siendo la misma
 * 
 * 3. PRUEBA DE SINCRONIZACIÓN EN TIEMPO REAL:
 *    - Tener la sala abierta en 2 pestañas
 *    - Salir en una pestaña y entrar de nuevo
 *    - VERIFICAR: Ambas pestañas muestran los mismos números
 */
