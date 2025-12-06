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
  return true;
});
