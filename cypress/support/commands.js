// ***********************************************
// Custom commands for Bingo Pao E2E tests
// ***********************************************

const API_URL = Cypress.env("API_URL") || "http://localhost:3000";

// ==================== TEST DATA MANAGEMENT ====================

/**
 * Crea datos de prueba completos (usuario, sala, cartones, etc.)
 * @returns {Cypress.Chainable<{testSessionId, user, room, rounds, cards, wallet}>}
 */
Cypress.Commands.add("createTestData", () => {
  return cy.request({
    method: "POST",
    url: `${API_URL}/api/testing/create`,
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status !== 201) {
      throw new Error(`Failed to create test data: ${JSON.stringify(response.body)}`);
    }
    
    const { testSessionId, data } = response.body;
    
    // Guardar en Cypress.env para uso en tests
    Cypress.env("testSessionId", testSessionId);
    Cypress.env("testUser", data.user);
    Cypress.env("testRoom", data.room);
    Cypress.env("testRounds", data.rounds);
    Cypress.env("testCards", data.cards);
    Cypress.env("testWallet", data.wallet);
    
    // NO usar cy.window() aquí porque no hay página cargada aún
    // El token se guardará cuando se llame cy.loginWithTestUser() o cy.goToTestRoom()
    
    return cy.wrap({
      testSessionId,
      user: data.user,
      room: data.room,
      rounds: data.rounds,
      cards: data.cards,
      wallet: data.wallet,
    });
  });
});

/**
 * Limpia los datos de prueba de la sesión actual
 */
Cypress.Commands.add("cleanupTestData", () => {
  const testSessionId = Cypress.env("testSessionId");
  
  if (!testSessionId) {
    cy.log("No test session to cleanup");
    return;
  }
  
  return cy.request({
    method: "DELETE",
    url: `${API_URL}/api/testing/cleanup/${testSessionId}`,
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200) {
      cy.log("Test data cleaned up successfully");
    } else {
      cy.log(`Cleanup warning: ${JSON.stringify(response.body)}`);
    }
    
    // Limpiar Cypress.env
    Cypress.env("testSessionId", null);
    Cypress.env("testUser", null);
    Cypress.env("testRoom", null);
    Cypress.env("testRounds", null);
    Cypress.env("testCards", null);
    Cypress.env("testWallet", null);
  });
});

/**
 * Limpia TODOS los datos de test (útil antes de empezar suite)
 */
Cypress.Commands.add("cleanupAllTestData", () => {
  return cy.request({
    method: "DELETE",
    url: `${API_URL}/api/testing/cleanup-all`,
    failOnStatusCode: false,
  }).then((response) => {
    cy.log(`Global cleanup: ${JSON.stringify(response.body)}`);
  });
});

/**
 * Inicia una ronda de prueba
 */
Cypress.Commands.add("startTestRound", (roomId, roundNumber) => {
  return cy.request({
    method: "POST",
    url: `${API_URL}/api/testing/start-round`,
    body: { roomId, roundNumber },
  }).then((response) => {
    return cy.wrap(response.body);
  });
});

/**
 * Simula llamar un número en la ronda
 */
Cypress.Commands.add("callTestNumber", (roomId, roundNumber, number) => {
  return cy.request({
    method: "POST",
    url: `${API_URL}/api/testing/call-number`,
    body: { roomId, roundNumber, number },
  }).then((response) => {
    return cy.wrap(response.body);
  });
});

// ==================== AUTHENTICATION ====================

/**
 * Login con usuario de prueba creado (requiere página ya cargada, o visitar primero)
 */
Cypress.Commands.add("loginWithTestUser", () => {
  const testUser = Cypress.env("testUser");
  
  if (!testUser) {
    throw new Error("No test user available. Call cy.createTestData() first.");
  }
  
  // Crear el objeto auth_user que espera el frontend
  const authUser = {
    id: testUser.id,
    email: testUser.email,
    full_name: "Cypress TestUser",
    token: testUser.token,
    expired_token_date: new Date(Date.now() + 3600000).toISOString() // 1 hora
  };
  
  // Visitar home primero para establecer token
  cy.visit("/", {
    onBeforeLoad(win) {
      // Establecer TODAS las claves que espera el frontend
      win.localStorage.setItem("auth_user", JSON.stringify(authUser));
      win.localStorage.setItem("auth_token", testUser.token);
      win.localStorage.setItem("userId", testUser.id);
    }
  });
});

/**
 * Login con credenciales específicas
 */
Cypress.Commands.add("login", (email, password) => {
  cy.visit("/login");
  cy.get('input[type="email"], input[name="email"]').type(email);
  cy.get('input[type="password"], input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should("not.include", "/login");
});

// ==================== NAVIGATION ====================

/**
 * Navega a la sala de prueba (establece token antes de visitar)
 */
Cypress.Commands.add("goToTestRoom", () => {
  const testRoom = Cypress.env("testRoom");
  const testUser = Cypress.env("testUser");
  
  if (!testRoom) {
    throw new Error("No test room available. Call cy.createTestData() first.");
  }
  
  // Crear el objeto auth_user que espera el frontend
  const authUser = testUser ? {
    id: testUser.id,
    email: testUser.email,
    full_name: "Cypress TestUser",
    token: testUser.token,
    expired_token_date: new Date(Date.now() + 3600000).toISOString() // 1 hora
  } : null;
  
  // Visitar primero para tener acceso a window
  cy.visit(`/game/${testRoom.id}`, {
    onBeforeLoad(win) {
      // Establecer TODAS las claves de autenticación ANTES de que la página cargue
      if (testUser && authUser) {
        win.localStorage.setItem("auth_user", JSON.stringify(authUser));
        win.localStorage.setItem("auth_token", testUser.token);
        win.localStorage.setItem("userId", testUser.id);
      }
    }
  });
  
  cy.url().should("include", `/game/${testRoom.id}`);
});

// ==================== VERIFICATION ====================

/**
 * Verifica que todos los modales están cerrados
 */
Cypress.Commands.add("verifyRoundReset", () => {
  cy.get('[role="dialog"]').should("not.exist");
  cy.get('[data-testid="confetti"]').should("not.exist");
});

/**
 * Verifica que el modal de bingo está cerrado
 */
Cypress.Commands.add("verifyBingoModalClosed", () => {
  cy.get('[role="dialog"]').should("not.exist");
  cy.get(".MuiDialog-root").should("not.exist");
});

/**
 * Espera a que WebSocket esté conectado
 */
Cypress.Commands.add("waitForWebSocket", () => {
  // Esperar a que el estado de conexión sea true
  cy.window().should((win) => {
    // Verificar que la app haya cargado con autenticación
    // Usamos auth_token que es la clave correcta
    const authToken = win.localStorage.getItem("auth_token");
    const authUser = win.localStorage.getItem("auth_user");
    expect(authToken || authUser, "Authentication should be present").to.not.be.null;
  });
  
  // Dar tiempo para que WebSocket conecte
  cy.wait(2000);
});

// ==================== GAME ACTIONS ====================

/**
 * Marca un número en un cartón específico
 */
Cypress.Commands.add("markNumber", (cardIndex, number) => {
  cy.get(`[data-testid="card-${cardIndex}"]`)
    .find(`[data-number="${number}"]`)
    .click();
});

/**
 * Abre el modal de un cartón
 */
Cypress.Commands.add("openCardModal", (cardIndex) => {
  cy.get(`[data-testid="card-miniature-${cardIndex}"]`).click();
  cy.get('[role="dialog"]').should("be.visible");
});

/**
 * Cierra el modal actual
 */
Cypress.Commands.add("closeModal", () => {
  cy.get("body").type("{esc}");
  cy.get('[role="dialog"]').should("not.exist");
});
