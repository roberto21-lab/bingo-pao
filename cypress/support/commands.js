// ***********************************************
// Custom commands for Bingo Pao E2E tests
// ***********************************************

// Login command
Cypress.Commands.add("login", (email, password) => {
  cy.visit("/login");
  cy.get('input[type="email"], input[name="email"]').type(email);
  cy.get('input[type="password"], input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should("not.include", "/login");
});

// Verify round reset
Cypress.Commands.add("verifyRoundReset", () => {
  // Verify no bingo validation modal is open
  cy.get('[role="dialog"]').should("not.exist");
  
  // Verify no confetti animation
  cy.get('[data-testid="confetti"]').should("not.exist");
});

// Verify bingo modal is closed
Cypress.Commands.add("verifyBingoModalClosed", () => {
  cy.get('[role="dialog"]').should("not.exist");
  cy.get(".MuiDialog-root").should("not.exist");
});
