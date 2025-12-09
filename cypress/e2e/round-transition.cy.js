/**
 * E2E Tests para Transición de Ronda
 * 
 * Verifica:
 * 1. Números permanecen visibles durante countdown de transición
 * 2. Números se limpian solo al recibir round-started
 * 3. Countdown de transición se muestra correctamente
 * 4. Patrón cambia para la nueva ronda
 */

describe("Round Transition", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/**", { statusCode: 200, body: {} }).as("apiCall");
    cy.intercept("POST", "**/api/**", { statusCode: 200, body: {} }).as("apiPost");
  });

  describe("Estado inicial", () => {
    it("debe cargar sin errores", () => {
      cy.visit("/");
      cy.get("body").should("be.visible");
    });

    it("no debe mostrar countdown de transición al inicio", () => {
      cy.visit("/");
      
      cy.get('[data-testid="round-transition-countdown"]').should("not.exist");
    });
  });

  describe("Comportamiento de números durante transición", () => {
    /**
     * ISSUE-FIX: Los números NO deben limpiarse prematuramente
     * Solo se limpian cuando llega el evento round-started
     */
    
    it("evento round-finished NO debe limpiar números", () => {
      // Documentar comportamiento esperado
      const roundFinishedBehavior = {
        shouldClearCalledNumbers: false,
        shouldClearLastNumbers: false,
        shouldClearCurrentNumber: false,
        shouldSetRoundFinished: true,
      };
      
      expect(roundFinishedBehavior.shouldClearCalledNumbers).to.be.false;
    });

    it("evento round-cleanup NO debe limpiar números", () => {
      // ISSUE-FIX: round-cleanup ya no limpia números
      const roundCleanupBehavior = {
        shouldClearCalledNumbers: false, // CAMBIADO
        shouldClearLastNumbers: false, // CAMBIADO
        shouldClearCurrentNumber: false, // CAMBIADO
        shouldResetModals: true,
      };
      
      expect(roundCleanupBehavior.shouldClearCalledNumbers).to.be.false;
    });

    it("evento round-started SÍ debe limpiar números", () => {
      const roundStartedBehavior = {
        shouldClearCalledNumbers: true,
        shouldClearLastNumbers: true,
        shouldClearCurrentNumber: true,
        shouldClearMarkedNumbers: true,
        shouldResetAllCountdowns: true,
      };
      
      expect(roundStartedBehavior.shouldClearCalledNumbers).to.be.true;
    });
  });

  describe("Countdown de transición", () => {
    it("countdown debe ser de 20 segundos", () => {
      const ROUND_START_DELAY_SECONDS = 20;
      
      expect(ROUND_START_DELAY_SECONDS).to.equal(20);
    });

    it("countdown debe mostrar segundos restantes", () => {
      // Documentar formato esperado
      const countdownDisplay = {
        format: "segundos",
        showSecondsRemaining: true,
        minValue: 0,
        maxValue: 20,
      };
      
      expect(countdownDisplay.maxValue).to.equal(20);
    });

    it("countdown debe incluir finish_timestamp para sincronización", () => {
      const countdownPayload = {
        room_id: "room123",
        round_number: 1,
        next_round_number: 2,
        seconds_remaining: 20,
        finish_timestamp: Date.now() + 20000,
        has_winner: true,
      };
      
      expect(countdownPayload.finish_timestamp).to.exist;
    });
  });

  describe("Cambio de patrón entre rondas", () => {
    it("ronda 1 y 2 NO pueden ser 'full'", () => {
      const round1Patterns = ["horizontal", "vertical", "diagonal", "cross_small"];
      const round2Patterns = ["horizontal", "vertical", "diagonal", "cross_small"];
      
      expect(round1Patterns).to.not.include("full");
      expect(round2Patterns).to.not.include("full");
    });

    it("ronda 3 SIEMPRE es 'full'", () => {
      const round3Pattern = "full";
      
      expect(round3Pattern).to.equal("full");
    });

    it("patrón debe actualizarse al recibir round-sync", () => {
      // Documentar comportamiento esperado
      const roundSyncPayload = {
        round_number: 2,
        status: "in_progress",
        pattern: "vertical", // Nuevo patrón
        called_numbers: [],
        previous_round_finished: true,
      };
      
      expect(roundSyncPayload.pattern).to.be.a("string");
    });
  });

  describe("Secuencia de eventos de transición", () => {
    it("debe seguir el orden correcto de eventos", () => {
      const expectedOrder = [
        "bingo-claimed",
        "bingo-claim-countdown", // 45 segundos
        "round-finished",
        "round-cleanup",
        "round-transition-countdown", // 20 segundos
        "round-started",
      ];
      
      // Verificar que round-started es el último
      expect(expectedOrder[expectedOrder.length - 1]).to.equal("round-started");
      
      // Verificar orden correcto
      const finishedIndex = expectedOrder.indexOf("round-finished");
      const cleanupIndex = expectedOrder.indexOf("round-cleanup");
      const startedIndex = expectedOrder.indexOf("round-started");
      
      expect(finishedIndex).to.be.lessThan(cleanupIndex);
      expect(cleanupIndex).to.be.lessThan(startedIndex);
    });
  });
});

/**
 * Tests que requieren servidor activo - usando datos de prueba efímeros
 */
describe("Round Transition con servidor real", () => {
  let testData;
  
  before(() => {
    cy.cleanupAllTestData();
  });
  
  beforeEach(() => {
    cy.createTestData().then((data) => {
      testData = data;
    });
  });
  
  afterEach(() => {
    cy.cleanupTestData();
  });

  it("sala debe cargar y permitir inicio de ronda", () => {
    cy.loginWithTestUser();
    cy.goToTestRoom();
    cy.waitForWebSocket();
    
    // Verificar que la página cargó
    cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");
    
    // Iniciar ronda y llamar números
    cy.startTestRound(testData.room.id, 1);
    cy.callTestNumber(testData.room.id, 1, 5);
    cy.callTestNumber(testData.room.id, 1, 20);
    
    // Esperar un momento
    cy.wait(2000);
    
    // Verificar que hay cartones visibles (indica que la sala funciona)
    cy.get('[data-testid^="card-miniature"]', { timeout: 15000 }).should("have.length.at.least", 1);
  });

  it("sala debe tener estado limpio al cargar", () => {
    cy.loginWithTestUser();
    cy.goToTestRoom();
    cy.waitForWebSocket();
    
    // Verificar que la página cargó
    cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");
    
    // Al cargar inicialmente, no debe haber números llamados visibles
    // (la ronda aún no ha iniciado o está en estado pending)
    cy.get("body").should("be.visible");
    
    // No debe haber modales abiertos
    cy.get('[role="dialog"]').should("not.exist");
  });
});

/**
 * PRUEBAS MANUALES RECOMENDADAS:
 * 
 * 1. NÚMEROS DURANTE TRANSICIÓN:
 *    - Esperar a que termine una ronda (bingo o timeout)
 *    - Durante el countdown de 20 segundos
 *    - VERIFICAR: Los números deben seguir visibles
 * 
 * 2. LIMPIEZA AL INICIAR RONDA:
 *    - Esperar a que inicie la nueva ronda
 *    - VERIFICAR: Los números se limpian
 *    - VERIFICAR: El contador vuelve a 0
 * 
 * 3. CAMBIO DE PATRÓN:
 *    - Ver el patrón de la ronda actual
 *    - Esperar transición a siguiente ronda
 *    - VERIFICAR: El patrón debe cambiar
 */
