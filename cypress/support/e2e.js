// ***********************************************************
// This file is processed and loaded automatically before your test files.
// ***********************************************************

// Import commands
import "./commands";

// Prevent Cypress from failing tests on uncaught exceptions
Cypress.on("uncaught:exception", (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  if (err.message.includes("WebSocket") || err.message.includes("socket")) {
    return false;
  }
  // Ignorar errores de React que no afectan los tests
  if (err.message.includes("ResizeObserver") || err.message.includes("hydrat")) {
    return false;
  }
  return true;
});

// Limpieza global antes de todos los tests
before(() => {
  // Limpiar cualquier dato de test residual de ejecuciones anteriores
  cy.log("🧹 Global cleanup before all tests...");
  cy.cleanupAllTestData();
});

// Limpieza global después de todos los tests
after(() => {
  // Asegurar que no queden datos de test
  cy.log("🧹 Global cleanup after all tests...");
  cy.cleanupAllTestData();
});

// Limpiar localStorage entre tests (solo si hay una página cargada)
// Nota: cy.window() requiere que haya una página, así que lo hacemos dentro del test si es necesario
