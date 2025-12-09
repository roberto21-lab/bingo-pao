const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    supportFile: "cypress/support/e2e.js",
    specPattern: "cypress/e2e/**/*.cy.js",
    viewportWidth: 375,
    viewportHeight: 667,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    // Reintentar en errores de red
    retries: {
      runMode: 1,
      openMode: 0,
    },
    env: {
      API_URL: "http://localhost:3000",
    },
    setupNodeEvents(on, config) {
      // Cleanup antes de correr todos los tests
      on("before:run", async () => {
        console.log("🧹 Cleaning up test data before run...");
      });
      
      // Cleanup después de correr todos los tests
      on("after:run", async () => {
        console.log("🧹 Cleaning up test data after run...");
      });
      
      return config;
    },
  },
});
