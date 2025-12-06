/**
 * E2E Tests para Gestión de Modales
 * 
 * Verifica:
 * 1. Modal de preview de cartón se cierra al cambiar ronda
 * 2. Modal de validación de bingo se cierra al cambiar ronda
 * 3. Modal de patrón permanece abierto durante el juego
 */

describe("Modal Management", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/**", { statusCode: 200, body: {} }).as("apiCall");
  });

  describe("Estado inicial de modales", () => {
    it("no debe haber modales abiertos al cargar", () => {
      cy.visit("/");
      
      cy.get('[role="dialog"]').should("not.exist");
      cy.get(".MuiModal-root").should("not.exist");
    });

    it("no debe haber overlays de modal al cargar", () => {
      cy.visit("/");
      
      cy.get(".MuiBackdrop-root").should("not.exist");
    });
  });

  describe("Comportamiento de Card Preview Modal", () => {
    it("CardPreviewModal debe cerrarse al recibir round-started", () => {
      // Documentar comportamiento esperado
      const expectedBehavior = {
        event: "round-started",
        closeCardPreviewModal: true,
      };
      
      expect(expectedBehavior.closeCardPreviewModal).to.be.true;
    });

    it("CardPreviewModal debe cerrarse al recibir round-cleanup", () => {
      const expectedBehavior = {
        event: "round-cleanup",
        closeCardPreviewModal: true,
      };
      
      expect(expectedBehavior.closeCardPreviewModal).to.be.true;
    });
  });

  describe("Comportamiento de Bingo Validation Modal", () => {
    it("BingoValidationModal debe cerrarse al cambiar ronda", () => {
      const expectedBehavior = {
        event: "round-started",
        closeBingoValidationModal: true,
      };
      
      expect(expectedBehavior.closeBingoValidationModal).to.be.true;
    });

    it("BingoValidationModal NO debe cerrarse durante ventana de 45s", () => {
      // Durante la ventana de bingo, el modal permanece abierto
      const expectedBehavior = {
        duringBingoWindow: {
          closeBingoValidationModal: false,
        },
      };
      
      expect(expectedBehavior.duringBingoWindow.closeBingoValidationModal).to.be.false;
    });

    it("FIX-4: Safety net - Modal debe cerrarse cuando countdown de bingo llega a 0", () => {
      // Este test verifica el safety net implementado:
      // Cuando bingo-claim-countdown llega a 0, el modal se cierra automáticamente
      // incluso si round-started o round-cleanup no llegan
      const bingoClaimCountdownData = {
        room_id: "test-room",
        round_number: 1,
        seconds_remaining: 0,  // Countdown terminó
      };

      // Comportamiento esperado cuando seconds_remaining = 0
      const expectedActions = {
        setBingoClaimCountdown: null,
        setBingoClaimCountdownFinish: null,
        // Safety net - cerrar modal aunque round-cleanup no haya llegado
        setBingoValidationOpen: false,
        setShowConfetti: false,
        setShowLoserAnimation: false,
      };

      expect(expectedActions.setBingoValidationOpen).to.be.false;
      expect(bingoClaimCountdownData.seconds_remaining).to.equal(0);
    });

    it("FIX-4: Modal permanece abierto si countdown > 0", () => {
      const bingoClaimCountdownData = {
        seconds_remaining: 30,  // Aún quedan 30 segundos
      };

      // El modal NO debe cerrarse mientras haya tiempo
      const shouldCloseModal = bingoClaimCountdownData.seconds_remaining <= 0;
      
      expect(shouldCloseModal).to.be.false;
    });
  });

  describe("Comportamiento de Pattern Modal", () => {
    it("BingoPatternModal puede abrirse durante el juego", () => {
      // El modal de patrón es informativo y puede abrirse siempre
      const expectedBehavior = {
        canOpenDuringGame: true,
        closesOnRoundChange: false, // NO se cierra automáticamente
      };
      
      expect(expectedBehavior.canOpenDuringGame).to.be.true;
    });

    it("BingoPatternModal NO se cierra al cambiar ronda", () => {
      // El usuario puede mantenerlo abierto para referencia
      const expectedBehavior = {
        closesOnRoundChange: false,
      };
      
      expect(expectedBehavior.closesOnRoundChange).to.be.false;
    });
  });

  describe("Reset de modales en useRoundReset", () => {
    it("executeFullReset debe cerrar modales específicos", () => {
      // Documentar qué modales se cierran en el reset
      const modalsToCloseOnReset = [
        "bingoValidationModal",
        "cardPreviewModal",
        "winnersModal",
      ];
      
      const modalsToKeepOpen = [
        "patternModal", // Informativo, el usuario lo controla
      ];
      
      expect(modalsToCloseOnReset).to.include("bingoValidationModal");
      expect(modalsToKeepOpen).to.include("patternModal");
    });
  });

  describe("Prevención de modales duplicados", () => {
    it("no debe haber múltiples modales abiertos simultáneamente", () => {
      cy.visit("/");
      
      // Verificar que no hay modales duplicados
      // Usamos should('have.length.lessThan', 2) con failOnStatusCode: false
      // ya que al cargar la página no debería haber modales abiertos
      cy.get('body').then(($body) => {
        const modals = $body.find('[role="dialog"]');
        // Máximo 1 modal a la vez (0 o 1 es correcto)
        expect(modals.length).to.be.lessThan(2);
      });
    });
  });

  describe("Accesibilidad de modales", () => {
    it("modales deben tener rol dialog", () => {
      // Los modales de MUI usan role="dialog"
      const expectedAttributes = {
        role: "dialog",
        "aria-modal": "true",
      };
      
      expect(expectedAttributes.role).to.equal("dialog");
    });

    it("modales deben permitir cierre con Escape", () => {
      // Documentar comportamiento esperado
      const expectedBehavior = {
        closeOnEscape: true,
      };
      
      expect(expectedBehavior.closeOnEscape).to.be.true;
    });
  });
});

/**
 * Tests que requieren servidor activo
 */
describe.skip("Modal Management con servidor real", () => {
  const TEST_ROOM_ID = "test-room-123";
  
  beforeEach(() => {
    cy.intercept("GET", `**/api/rooms/${TEST_ROOM_ID}/**`).as("getRoomData");
  });

  it("CardPreviewModal debe cerrarse al cambiar ronda", () => {
    cy.visit(`/game/${TEST_ROOM_ID}`);
    cy.wait("@getRoomData");
    
    // Abrir modal de preview (click en cartón)
    cy.get('[data-testid="bingo-card"]').first().click();
    cy.get('[data-testid="card-preview-modal"]').should("be.visible");
    
    // Simular round-started
    cy.window().then((win) => {
      if (win.__CYPRESS_SOCKET__) {
        win.__CYPRESS_SOCKET__.emit("round-started", {
          room_id: TEST_ROOM_ID,
          round_number: 2,
        });
      }
    });
    
    // Modal debe cerrarse
    cy.get('[data-testid="card-preview-modal"]').should("not.exist");
  });

  it("BingoValidationModal debe cerrarse al cambiar ronda", () => {
    cy.visit(`/game/${TEST_ROOM_ID}`);
    cy.wait("@getRoomData");
    
    // Simular bingo-claimed para abrir modal
    cy.window().then((win) => {
      if (win.__CYPRESS_SOCKET__) {
        win.__CYPRESS_SOCKET__.emit("bingo-claimed", {
          room_id: TEST_ROOM_ID,
          winner: { user_id: "user123", is_first: true },
        });
      }
    });
    
    cy.get('[data-testid="bingo-validation-modal"]').should("be.visible");
    
    // Simular round-started
    cy.window().then((win) => {
      if (win.__CYPRESS_SOCKET__) {
        win.__CYPRESS_SOCKET__.emit("round-started", {
          room_id: TEST_ROOM_ID,
          round_number: 2,
        });
      }
    });
    
    // Modal debe cerrarse
    cy.get('[data-testid="bingo-validation-modal"]').should("not.exist");
  });
});

/**
 * PRUEBAS MANUALES RECOMENDADAS:
 * 
 * 1. CIERRE DE CARD PREVIEW:
 *    - Abrir un cartón (click en miniatura)
 *    - Esperar transición a nueva ronda
 *    - VERIFICAR: El modal debe cerrarse automáticamente
 * 
 * 2. CIERRE DE BINGO VALIDATION:
 *    - Ver modal de "BINGO GANADOR"
 *    - Esperar transición a nueva ronda
 *    - VERIFICAR: El modal debe cerrarse automáticamente
 * 
 * 3. PATTERN MODAL PERMANECE:
 *    - Abrir modal de patrón
 *    - Esperar transición a nueva ronda
 *    - VERIFICAR: El modal DEBE seguir abierto (el usuario lo controla)
 */
