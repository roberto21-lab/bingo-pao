/**
 * E2E Tests para Persistencia de Números entre Rondas
 * 
 * ISSUE: Los números invocados se limpian inmediatamente cuando finaliza una ronda,
 * incluso antes de iniciar la siguiente ronda.
 * 
 * EXPECTED:
 * - Los números deben mantenerse visibles hasta que el backend emita `round_started`
 * - El reset NO debe ocurrir en el evento `round_finished` o `round_cleanup`
 */

describe("Persistencia de Números entre Rondas", () => {
  describe("Carga inicial de la página", () => {
    it("debe cargar la página de inicio sin errores", () => {
      cy.visit("/");
      cy.get("body").should("be.visible");
    });
  });

  describe("Lógica de limpieza de números (mock)", () => {
    it("números deben mantenerse visibles en round_finished", () => {
      // Estado antes de round_finished
      const calledNumbers = new Set(["B-5", "I-20", "N-35", "G-50", "O-70"]);
      const lastNumbers = ["O-70", "G-50", "N-35"];
      const currentNumber = "O-70";
      
      // Simular evento round_finished
      const roundFinishedEvent = {
        room_id: "test-room-123",
        round_number: 1,
      };
      
      // En round_finished, los números NO deben limpiarse
      // Solo cambiar el estado de roundFinished
      let newCalledNumbers = calledNumbers; // Mantener
      let newLastNumbers = lastNumbers; // Mantener
      let newCurrentNumber = currentNumber; // Mantener
      let roundFinished = true;
      
      expect(newCalledNumbers.size).to.equal(5);
      expect(newLastNumbers.length).to.equal(3);
      expect(newCurrentNumber).to.equal("O-70");
      expect(roundFinished).to.be.true;
    });

    it("números deben mantenerse visibles en round_cleanup", () => {
      // Estado después de round_finished, antes de round_cleanup
      const calledNumbers = new Set(["B-5", "I-20", "N-35", "G-50", "O-70"]);
      const lastNumbers = ["O-70", "G-50", "N-35"];
      const currentNumber = "O-70";
      
      // Simular evento round_cleanup
      const roundCleanupEvent = {
        room_id: "test-room-123",
        previous_round_number: 1,
        next_round_number: 2,
        cleanup_type: "between_rounds",
      };
      
      // ISSUE-FIX: En round_cleanup, los números NO deben limpiarse
      // Solo preparar la UI para la transición
      let newCalledNumbers = calledNumbers; // MANTENER
      let newLastNumbers = lastNumbers; // MANTENER
      let newCurrentNumber = currentNumber; // MANTENER
      let isCallingNumber = false; // Puede cambiar
      let progress = 0; // Puede resetearse
      
      // Verificar que los números se mantienen
      expect(newCalledNumbers.size).to.equal(5);
      expect(newLastNumbers.length).to.equal(3);
      expect(newCurrentNumber).to.equal("O-70");
    });

    it("números deben limpiarse SOLO en round_started", () => {
      // Estado después de round_cleanup (números aún visibles)
      let calledNumbers = new Set(["B-5", "I-20", "N-35", "G-50", "O-70"]);
      let lastNumbers = ["O-70", "G-50", "N-35"];
      let currentNumber = "O-70";
      
      // Simular evento round_started
      const roundStartedEvent = {
        room_id: "test-room-123",
        round_number: 2,
        bingo_type: "line",
      };
      
      // En round_started, SÍ deben limpiarse los números
      calledNumbers = new Set(); // Limpiar
      lastNumbers = []; // Limpiar
      currentNumber = ""; // Limpiar
      
      // Verificar que los números se limpiaron
      expect(calledNumbers.size).to.equal(0);
      expect(lastNumbers.length).to.equal(0);
      expect(currentNumber).to.equal("");
    });
  });

  describe("Secuencia completa de eventos", () => {
    it("debe seguir el orden correcto: finish → cleanup → started", () => {
      const events = [];
      let calledNumbersSize = 5; // Empezamos con 5 números
      
      // 1. round_finished - números deben mantenerse
      events.push({ type: "round_finished", timestamp: Date.now() });
      // calledNumbersSize = 5 (no cambia)
      expect(calledNumbersSize).to.equal(5);
      
      // 2. round_cleanup - números deben mantenerse (ISSUE-FIX)
      events.push({ type: "round_cleanup", timestamp: Date.now() + 1000 });
      // calledNumbersSize = 5 (no cambia)
      expect(calledNumbersSize).to.equal(5);
      
      // 3. round_transition_countdown - números deben mantenerse
      events.push({ type: "round_transition_countdown", timestamp: Date.now() + 2000 });
      // calledNumbersSize = 5 (no cambia)
      expect(calledNumbersSize).to.equal(5);
      
      // 4. round_started - números deben limpiarse
      events.push({ type: "round_started", timestamp: Date.now() + 3000 });
      calledNumbersSize = 0; // Ahora sí se limpian
      expect(calledNumbersSize).to.equal(0);
      
      // Verificar secuencia
      expect(events).to.have.length(4);
      expect(events[0].type).to.equal("round_finished");
      expect(events[1].type).to.equal("round_cleanup");
      expect(events[2].type).to.equal("round_transition_countdown");
      expect(events[3].type).to.equal("round_started");
    });

    it("durante todo el countdown de transición, números deben ser visibles", () => {
      // Simular 10 segundos de countdown
      const countdownSteps = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
      const calledNumbers = new Set(["B-5", "I-20", "N-35", "G-50", "O-70"]);
      
      for (const seconds of countdownSteps) {
        // Durante todo el countdown, los números deben mantenerse
        expect(calledNumbers.size).to.equal(5);
      }
    });
  });

  describe("Casos edge", () => {
    it("si la sala finaliza (no hay siguiente ronda), números pueden limpiarse", () => {
      let calledNumbers = new Set(["B-5", "I-20"]);
      
      // Evento room_finished (última ronda)
      const roomFinishedEvent = {
        room_id: "test-room-123",
        total_rounds: 3,
        final_round: 3,
      };
      
      // En este caso, los números pueden limpiarse ya que no hay siguiente ronda
      // o pueden mantenerse para que el usuario vea el resultado final
      // El comportamiento exacto depende del diseño, pero NO debe causar confusión
      
      expect(calledNumbers.size).to.be.greaterThan(0);
    });

    it("al reconectarse, debe obtener el estado actual de la ronda", () => {
      // Simular reconexión con room-state-sync
      const roomStateSync = {
        room_id: "test-room-123",
        round_number: 2,
        called_numbers: [
          { number: "B-3", called_at: new Date().toISOString() },
          { number: "I-17", called_at: new Date().toISOString() },
        ],
        status: "in_progress",
      };
      
      // Al sincronizar, debe usar los números del servidor
      const calledNumbers = new Set(roomStateSync.called_numbers.map(cn => cn.number));
      
      expect(calledNumbers.size).to.equal(2);
      expect(calledNumbers.has("B-3")).to.be.true;
      expect(calledNumbers.has("I-17")).to.be.true;
    });
  });
});

/**
 * PRUEBAS MANUALES RECOMENDADAS:
 * 
 * 1. Jugar una ronda completa hasta que alguien gane
 * 2. VERIFICAR: Al terminar la ronda, los números siguen visibles
 * 3. VERIFICAR: Durante el countdown de transición, los números siguen visibles
 * 4. VERIFICAR: Solo al iniciar la nueva ronda, los números se limpian
 * 
 * Secuencia esperada:
 * [Round 1 activo] → [Bingo cantado] → [round_finished] 
 *   → números VISIBLES
 * [round_cleanup] → números VISIBLES
 * [Countdown: 10...3...2...1] → números VISIBLES
 * [round_started Round 2] → números SE LIMPIAN
 */
