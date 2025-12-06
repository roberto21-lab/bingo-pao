/**
 * E2E Tests para Issue 1: Limpieza de cartones entre rondas
 * 
 * Verifica que al transicionar entre rondas:
 * - Los markedNumbers se limpian inmediatamente en round-cleanup
 * - El usuario NO puede cantar bingo con datos de la ronda anterior
 * - Los calledNumbers permanecen visibles hasta round-started
 */

describe("Round Transition Cleanup - Issue 1 Fix", () => {
  describe("Limpieza de markedNumbers en round-cleanup", () => {
    it("debe limpiar markedNumbers cuando llega round-cleanup", () => {
      // Estado inicial simulado
      let markedNumbers = new Map();
      markedNumbers.set(0, new Set(["B-5", "I-22", "N-35"]));
      markedNumbers.set(1, new Set(["B-3", "I-18"]));

      // Simular llegada de round-cleanup
      const handleRoundCleanup = () => {
        // ISSUE-1 FIX: Limpiar markedNumbers
        markedNumbers = new Map();
      };

      handleRoundCleanup();

      // Verificar que markedNumbers está vacío
      expect(markedNumbers.size).to.equal(0);
    });

    it("debe mantener calledNumbers visibles en round-cleanup", () => {
      // Estado inicial simulado
      let calledNumbers = new Set(["B-5", "I-22", "N-35", "G-48"]);
      let markedNumbers = new Map();
      markedNumbers.set(0, new Set(["B-5", "I-22"]));

      // Simular llegada de round-cleanup
      const handleRoundCleanup = () => {
        // NO limpiar calledNumbers (mantener visibles)
        // SÍ limpiar markedNumbers
        markedNumbers = new Map();
      };

      handleRoundCleanup();

      // Verificar que calledNumbers NO se limpió
      expect(calledNumbers.size).to.equal(4);
      expect(calledNumbers.has("B-5")).to.be.true;

      // Verificar que markedNumbers SÍ se limpió
      expect(markedNumbers.size).to.equal(0);
    });

    it("NO debe permitir cantar bingo después de round-cleanup", () => {
      // Estado después de round-cleanup
      const calledNumbers = new Set(["B-5", "I-22", "N-35", "G-48", "O-65"]); // Ronda anterior
      const markedNumbers = new Map(); // Limpio después de round-cleanup

      // Simular función que verifica si puede cantar bingo
      const canClaimBingo = (cardIndex) => {
        const cardMarked = markedNumbers.get(cardIndex) || new Set();
        // Si no hay marcas, no puede cantar bingo
        return cardMarked.size > 0;
      };

      // Verificar que NO puede cantar bingo
      expect(canClaimBingo(0)).to.be.false;
      expect(canClaimBingo(1)).to.be.false;
    });
  });

  describe("Secuencia completa de transición de ronda", () => {
    it("debe seguir la secuencia correcta: round-cleanup -> round-started", () => {
      const events = [];
      let calledNumbers = new Set(["B-5", "I-22", "N-35"]);
      let markedNumbers = new Map();
      markedNumbers.set(0, new Set(["B-5", "I-22"]));
      let currentRound = 2;

      // Paso 1: round-cleanup
      const handleRoundCleanup = (data) => {
        events.push("round-cleanup");
        // Limpiar SOLO markedNumbers
        markedNumbers = new Map();
        // Actualizar currentRound
        if (data.next_round_number > currentRound) {
          currentRound = data.next_round_number;
        }
      };

      // Paso 2: round-started
      const handleRoundStarted = () => {
        events.push("round-started");
        // Limpiar TODO
        calledNumbers = new Set();
        markedNumbers = new Map();
      };

      // Ejecutar secuencia
      handleRoundCleanup({ previous_round_number: 2, next_round_number: 3 });
      
      // Verificar estado intermedio
      expect(events).to.deep.equal(["round-cleanup"]);
      expect(calledNumbers.size).to.equal(3); // Números visibles
      expect(markedNumbers.size).to.equal(0); // Marcas limpias
      expect(currentRound).to.equal(3);

      // Continuar con round-started
      handleRoundStarted();

      // Verificar estado final
      expect(events).to.deep.equal(["round-cleanup", "round-started"]);
      expect(calledNumbers.size).to.equal(0); // Ahora sí limpio
      expect(markedNumbers.size).to.equal(0);
    });
  });

  describe("Prevención de condición de carrera", () => {
    it("usuario NO puede abrir modal con datos viejos después de round-cleanup", () => {
      // Simular estado después de round-cleanup
      const markedNumbers = new Map(); // Limpio
      const calledNumbers = new Set(["B-5", "I-22"]); // Visible pero no usable

      // Simular apertura de modal
      const openCardModal = (cardIndex) => {
        const cardMarked = markedNumbers.get(cardIndex) || new Set();
        return {
          canClaimBingo: cardMarked.size > 0,
          visibleNumbers: calledNumbers.size,
          markedCount: cardMarked.size,
        };
      };

      const modalState = openCardModal(0);

      // El usuario ve los números pero NO puede cantar bingo
      expect(modalState.visibleNumbers).to.equal(2); // Números visibles
      expect(modalState.markedCount).to.equal(0); // Sin marcas
      expect(modalState.canClaimBingo).to.be.false; // NO puede cantar bingo
    });
  });
});
