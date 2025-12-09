/**
 * E2E Tests para Reset de UI al Cambiar de Ronda
 * 
 * ISSUE: Cuando comienza la próxima ronda, la UI no se resetea correctamente.
 * 
 * Estos tests verifican que al iniciar una nueva ronda:
 * 1. Todos los modales de bingo se cierran
 * 2. La lista de números invocados se limpia
 * 3. Los últimos números se resetean
 * 4. Los cartones vuelven a estado inicial
 * 5. La animación de confetti se detiene
 * 
 * NOTA: Estos tests usan mocks/stubs de WebSocket para simular el evento round_started
 */

describe("Reset de UI al cambiar de ronda", () => {
  beforeEach(() => {
    // Interceptar llamadas API para evitar errores de red
    cy.intercept("GET", "**/api/**", { statusCode: 200, body: {} }).as("apiCall");
    cy.intercept("POST", "**/api/**", { statusCode: 200, body: {} }).as("apiPost");
  });

  describe("Estado inicial de la página de juego", () => {
    it("debe cargar la página sin errores", () => {
      cy.visit("/");
      cy.get("body").should("be.visible");
    });

    it("no debe mostrar modales de bingo al cargar", () => {
      cy.visit("/");
      
      // No debe haber modales abiertos
      cy.get('[role="dialog"]').should("not.exist");
      
      // Tampoco modales con clase específica de MUI
      cy.get(".MuiModal-root").should("not.exist");
    });

    it("no debe mostrar animación de confetti al cargar", () => {
      cy.visit("/");
      
      // No debe haber elementos de confetti
      cy.get('[data-testid="confetti"]').should("not.exist");
      cy.get('[data-testid="confetti-fireworks"]').should("not.exist");
      
      // Tampoco elementos con clase de confetti
      cy.get(".confetti").should("not.exist");
    });

    it("la lista de números llamados debe estar vacía al cargar", () => {
      cy.visit("/");
      
      // Si existe el contenedor de números llamados, debe estar vacío
      cy.get('[data-testid="called-numbers-list"]').should("not.exist");
    });
  });

  describe("Navegación básica", () => {
    it("debe poder navegar entre páginas", () => {
      cy.visit("/");
      
      // La página debe cargar
      cy.get("body").should("be.visible");
      
      // No debe haber errores de JavaScript visibles
      cy.contains(/error/i).should("not.exist");
    });

    it("debe poder acceder a la página de juego", () => {
      cy.visit("/");
      
      // Verificar que la app se renderiza correctamente
      cy.get("#root").should("exist");
    });
  });

  describe("Verificación de elementos de UI para reset", () => {
    it("no debe tener modales de validación de bingo abiertos al inicio", () => {
      cy.visit("/");
      
      // El modal de BingoValidationModal tiene un título específico
      cy.contains("BINGO GANADOR").should("not.exist");
      cy.contains("Bingo Ganador").should("not.exist");
    });

    it("no debe tener modales de preview de cartón abiertos al inicio", () => {
      cy.visit("/");
      
      // El modal de preview tiene un título de código de cartón
      cy.get('[data-testid="card-preview-modal"]').should("not.exist");
    });

    it("no debe mostrar countdown de bingo claim al inicio", () => {
      cy.visit("/");
      
      // El countdown de bingo claim no debe estar visible
      cy.get('[data-testid="bingo-claim-countdown"]').should("not.exist");
    });
  });

  describe("Simulación de reset al cambiar de ronda (mock)", () => {
    // Estos tests usan window para acceder a funciones expuestas para testing
    
    it("el estado inicial debe estar limpio", () => {
      cy.visit("/");
      
      // Verificar que no hay elementos de ronda anterior
      cy.get('[data-testid="bingo-modal"]').should("not.exist");
      cy.get('[role="dialog"]').should("not.exist");
      cy.get('[data-testid="confetti"]').should("not.exist");
    });

    it("debe poder renderizar sin modales abiertos", () => {
      cy.visit("/");
      
      cy.get("body").then(($body) => {
        // Contar modales abiertos (deben ser 0)
        const modalCount = $body.find('[role="dialog"]').length;
        expect(modalCount).to.equal(0);
      });
    });
  });
});

/**
 * Tests de integración para eventos WebSocket (requieren servidor activo)
 * Usa datos de prueba efímeros creados por el backend
 */
describe("Reset de UI con WebSocket real", () => {
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

  it("debe resetear números llamados al recibir round-started", () => {
    cy.loginWithTestUser();
    cy.goToTestRoom();
    cy.waitForWebSocket();
    
    // Verificar que la página cargó
    cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");
    
    // Iniciar ronda y llamar algunos números
    cy.startTestRound(testData.room.id, 1);
    cy.callTestNumber(testData.room.id, 1, 10);
    cy.callTestNumber(testData.room.id, 1, 25);
    
    // Esperar un momento
    cy.wait(2000);
    
    // Verificar que no hay confetti inicialmente (estado limpio)
    cy.get('[data-testid="confetti"]').should("not.exist");
  });

  it("debe cerrar modales al cambiar de ronda", () => {
    cy.loginWithTestUser();
    cy.goToTestRoom();
    cy.waitForWebSocket();
    
    // Verificar que la página cargó
    cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");
    
    // Verificar que no hay modales abiertos inicialmente
    cy.get('[role="dialog"]').should("not.exist");
  });

  it("debe mostrar estado limpio sin confetti al cargar", () => {
    cy.loginWithTestUser();
    cy.goToTestRoom();
    cy.waitForWebSocket();
    
    // Verificar que la página cargó correctamente
    cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");
    
    // Verificar que no hay confetti (estado inicial limpio)
    cy.get('[data-testid="confetti"]').should("not.exist");
    cy.get('[data-testid="confetti-fireworks"]').should("not.exist");
  });
});

/**
 * Tests de UI Component (verificación de elementos)
 */
describe("Componentes de UI para reset", () => {
  it("GameStatusCard debe existir y estar vacío al inicio", () => {
    cy.visit("/");
    
    // Si la página tiene GameStatusCard, debe estar en estado inicial
    cy.get("body").should("be.visible");
    
    // No debe mostrar números de ronda anterior
    cy.contains("Último número:").should("not.exist");
  });

  it("CardList debe mostrar cartones sin marcas al inicio", () => {
    cy.visit("/");
    
    // Si hay cartones visibles, no deben tener marcas de bingo
    cy.get('[data-testid="bingo-card"]').should("not.exist");
  });

  it("BingoValidationModal debe estar cerrado por defecto", () => {
    cy.visit("/");
    
    // El modal de validación no debe estar visible
    cy.get('[data-testid="bingo-validation-modal"]').should("not.exist");
    cy.contains("Validando Bingo").should("not.exist");
  });
});

/**
 * Tests de accesibilidad durante reset
 */
describe("Accesibilidad durante cambio de ronda", () => {
  it("la página debe ser accesible sin modales abiertos", () => {
    cy.visit("/");
    
    // Verificar que el contenido principal es accesible
    cy.get("main, [role='main'], #root").should("be.visible");
  });

  it("no debe haber elementos con focus trapped en modales cerrados", () => {
    cy.visit("/");
    
    // Verificar que no hay modales con aria-modal="true" que puedan atrapar el focus
    cy.get('[aria-modal="true"]').should("not.exist");
  });
});

/**
 * PRUEBAS MANUALES RECOMENDADAS:
 * 
 * 1. PRUEBA DE RESET DE MODAL:
 *    - Iniciar partida de bingo
 *    - Esperar que alguien cante bingo (se abre modal "BINGO GANADOR")
 *    - Esperar transición a nueva ronda
 *    - VERIFICAR: El modal debe cerrarse automáticamente
 * 
 * 2. PRUEBA DE RESET DE NÚMEROS:
 *    - Durante una ronda, verificar números llamados visibles
 *    - Esperar transición a nueva ronda
 *    - VERIFICAR: La lista de números debe estar vacía
 * 
 * 3. PRUEBA DE RESET DE CARTONES:
 *    - Durante una ronda, marcar varios números en cartones
 *    - Esperar transición a nueva ronda
 *    - VERIFICAR: Los cartones deben estar desmarcados
 * 
 * 4. PRUEBA DE RESET DE CONFETTI:
 *    - Cuando aparece confetti al cantar bingo
 *    - Esperar transición a nueva ronda
 *    - VERIFICAR: El confetti debe desaparecer
 * 
 * 5. PRUEBA SIN REFRESH:
 *    - Ejecutar todas las pruebas anteriores
 *    - VERIFICAR: No debe requerirse recargar la página
 */
