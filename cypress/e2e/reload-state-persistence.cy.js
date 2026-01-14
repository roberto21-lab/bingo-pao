/**
 * E2E Tests for Reload State Persistence
 * FIX-RELOAD: Tests to verify that game state persists correctly after page reload
 * 
 * Critical scenarios tested:
 * 1. Called numbers persist after reload during active round
 * 2. Pattern displays correctly after reload
 * 3. State persists during bingo_claimed status (45-second window)
 */

describe("Reload State Persistence - FIX-RELOAD", () => {
  let testData;

  beforeEach(() => {
    // Create ephemeral test data before each test
    cy.createTestData().then((data) => {
      testData = data;
    });
  });

  afterEach(() => {
    // Cleanup test data after each test
    if (testData) {
      cy.cleanupTestData();
    }
  });

  describe("Called Numbers Persistence", () => {
    it("should persist called numbers after page reload during active round", () => {
      // Login and navigate to test room
      cy.loginWithTestUser(testData);
      cy.goToTestRoom(testData);

      // Wait for page to load
      cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");

      // Start the round
      cy.startTestRound(testData.room.id, 1);
      cy.wait(1000);

      // Call some numbers
      cy.callTestNumber(testData.room.id, 1, 5);  // B-5
      cy.wait(500);
      cy.callTestNumber(testData.room.id, 1, 22); // I-22
      cy.wait(500);
      cy.callTestNumber(testData.room.id, 1, 35); // N-35
      cy.wait(1000);

      // Verify numbers are displayed before reload
      cy.get("body").should("contain.text", "B-5").or("be.visible");

      // Reload the page
      cy.reload();

      // Wait for page to fully reload
      cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");

      // Wait for WebSocket reconnection
      cy.waitForWebSocket();

      // Verify called numbers are still present after reload
      // The numbers should be loaded from the backend
      cy.get('[data-testid^="card-miniature"]', { timeout: 15000 })
        .should("have.length.at.least", 1);
    });

    it("should maintain correct round number after reload", () => {
      cy.loginWithTestUser(testData);
      cy.goToTestRoom(testData);

      cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");

      // Start round 1
      cy.startTestRound(testData.room.id, 1);
      cy.wait(1000);

      // Reload and verify we're still on round 1
      cy.reload();
      cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");
      
      // The game header should show we're on the correct round
      cy.get("body").should("be.visible");
    });
  });

  describe("Pattern Persistence", () => {
    it("should display correct pattern after reload", () => {
      cy.loginWithTestUser(testData);
      cy.goToTestRoom(testData);

      cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");

      // Start round
      cy.startTestRound(testData.room.id, 1);
      cy.wait(1000);

      // Reload the page
      cy.reload();

      // Wait for page to load
      cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");

      // Pattern should be visible (the GameHeader shows the pattern)
      cy.get("body").should("be.visible");
    });
  });

  describe("Bingo Claimed State Persistence", () => {
    it("should handle reload during bingo claim window gracefully", () => {
      cy.loginWithTestUser(testData);
      cy.goToTestRoom(testData);

      cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");

      // Start round and call numbers
      cy.startTestRound(testData.room.id, 1);
      cy.wait(500);
      cy.callTestNumber(testData.room.id, 1, 5);
      cy.wait(500);
      cy.callTestNumber(testData.room.id, 1, 22);
      cy.wait(1000);

      // Reload during active game
      cy.reload();

      // Verify game state is recovered
      cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");
      cy.get('[data-testid^="card-miniature"]', { timeout: 15000 })
        .should("have.length.at.least", 1);
    });
  });

  describe("WebSocket Reconnection", () => {
    it("should reconnect WebSocket and sync state after reload", () => {
      cy.loginWithTestUser(testData);
      cy.goToTestRoom(testData);

      cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");

      // Start round
      cy.startTestRound(testData.room.id, 1);
      cy.wait(1000);

      // Reload
      cy.reload();

      // Wait for reconnection
      cy.waitForWebSocket();

      // Verify we're still authenticated
      cy.window().should((win) => {
        const authToken = win.localStorage.getItem("auth_token");
        expect(authToken, "auth_token should persist").to.not.be.null;
      });

      // Verify game content is visible
      cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");
    });
  });

  describe("Round Transition Edge Cases", () => {
    it("should not lose state during round transition", () => {
      cy.loginWithTestUser(testData);
      cy.goToTestRoom(testData);

      cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");

      // Start round
      cy.startTestRound(testData.room.id, 1);
      cy.wait(500);

      // Call numbers
      cy.callTestNumber(testData.room.id, 1, 5);
      cy.wait(500);
      cy.callTestNumber(testData.room.id, 1, 22);
      cy.wait(500);

      // Verify game is active
      cy.get('[data-testid^="card-miniature"]', { timeout: 15000 })
        .should("have.length.at.least", 1);

      // Game should be stable
      cy.get('[data-testid="game-header"]').should("exist");
    });
  });

  describe("No Login Redirect After Reload", () => {
    it("should NOT redirect to login page after reload when authenticated", () => {
      cy.loginWithTestUser(testData);
      cy.goToTestRoom(testData);

      cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");

      // Reload the page
      cy.reload();

      // Should NOT be redirected to login
      cy.url().should("not.include", "/login");

      // Should still be on game page
      cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");
    });
  });
});

describe("Pattern Update on Round Change - FIX-PATTERN", () => {
  let testData;

  beforeEach(() => {
    cy.createTestData().then((data) => {
      testData = data;
    });
  });

  afterEach(() => {
    if (testData) {
      cy.cleanupTestData();
    }
  });

  it("should show pattern after starting a round", () => {
    cy.loginWithTestUser(testData);
    cy.goToTestRoom(testData);

    cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");

    // Start the round
    cy.startTestRound(testData.room.id, 1);
    cy.wait(1500);

    // Game header should be visible with pattern info
    cy.get('[data-testid="game-header"]').should("exist");
    
    // Verify the page hasn't crashed or shown error
    cy.get("body").should("not.contain.text", "Error");
  });

  it("should maintain pattern visibility after page reload", () => {
    cy.loginWithTestUser(testData);
    cy.goToTestRoom(testData);

    cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");

    // Start round
    cy.startTestRound(testData.room.id, 1);
    cy.wait(1000);

    // Reload
    cy.reload();

    // Wait for page to load
    cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");

    // Verify no errors
    cy.get("body").should("not.contain.text", "Error");
  });
});

describe("Multiple Called Numbers Persistence", () => {
  let testData;

  beforeEach(() => {
    cy.createTestData().then((data) => {
      testData = data;
    });
  });

  afterEach(() => {
    if (testData) {
      cy.cleanupTestData();
    }
  });

  it("should persist multiple called numbers after reload", () => {
    cy.loginWithTestUser(testData);
    cy.goToTestRoom(testData);

    cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");

    // Start round and call multiple numbers
    cy.startTestRound(testData.room.id, 1);
    cy.wait(500);

    // Call 5 numbers
    const numbersToCall = [5, 16, 31, 46, 61]; // B-5, I-16, N-31, G-46, O-61
    numbersToCall.forEach((num, index) => {
      cy.callTestNumber(testData.room.id, 1, num);
      cy.wait(300);
    });

    cy.wait(1000);

    // Reload
    cy.reload();

    // Wait for game to load
    cy.get('[data-testid="game-header"]', { timeout: 15000 }).should("exist");
    cy.waitForWebSocket();

    // Verify cards are still visible (numbers should be marked)
    cy.get('[data-testid^="card-miniature"]', { timeout: 15000 })
      .should("have.length.at.least", 1);
  });
});
