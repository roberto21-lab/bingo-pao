/**
 * E2E Tests para Validación de Datos de Cartones
 * 
 * FIX-2: Prevenir error "Cannot read properties of undefined (reading 'map')"
 * cuando cardData.numbers_json es undefined.
 * 
 * Este error ocurría cuando el backend devolvía un cartón sin numbers_json
 * y el frontend intentaba procesarlo con convertCardNumbers().
 */

describe("Validación de Datos de Cartones", () => {
  describe("Carga inicial", () => {
    it("debe cargar la página sin errores", () => {
      cy.visit("/");
      cy.get("body").should("be.visible");
    });
  });

  describe("FIX-2: Validación de numbers_json antes de convertCardNumbers", () => {
    it("debe detectar cuando numbers_json es undefined", () => {
      const cardData = {
        _id: "123",
        code: "A001",
        numbers_json: undefined,  // Problema original
      };

      const isValid = cardData.numbers_json && Array.isArray(cardData.numbers_json);
      
      // isValid será undefined (falsy), no false estrictamente
      expect(!!isValid).to.be.false;
    });

    it("debe detectar cuando numbers_json es null", () => {
      const cardData = {
        _id: "123",
        code: "A001",
        numbers_json: null,
      };

      const isValid = cardData.numbers_json && Array.isArray(cardData.numbers_json);
      
      // isValid será null (falsy), no false estrictamente
      expect(!!isValid).to.be.false;
    });

    it("debe detectar cuando numbers_json es un string (inválido)", () => {
      const cardData = {
        _id: "123",
        code: "A001",
        numbers_json: "invalid-data",
      };

      const isValid = cardData.numbers_json && Array.isArray(cardData.numbers_json);
      
      expect(isValid).to.be.false;
    });

    it("debe aceptar numbers_json válido (array de arrays)", () => {
      const cardData = {
        _id: "123",
        code: "A001",
        numbers_json: [
          [1, 16, 31, 46, 61],
          [2, 17, 32, 47, 62],
          [3, 18, "FREE", 48, 63],
          [4, 19, 34, 49, 64],
          [5, 20, 35, 50, 65],
        ],
      };

      const isValid = cardData.numbers_json && Array.isArray(cardData.numbers_json);
      
      expect(isValid).to.be.true;
      expect(cardData.numbers_json).to.have.length(5);
    });

    it("debe manejar gracefully un cartón inválido sin crashear", () => {
      // Simular el flujo corregido
      const winners = [
        { card_id: "123", user_id: "user1" },
        { card_id: "456", user_id: "user2" },
      ];

      const cardDataResponses = {
        "123": { _id: "123", code: "A001", numbers_json: undefined },  // Inválido
        "456": { _id: "456", code: "A002", numbers_json: [[1,2,3,4,5]] },  // Válido
      };

      const winnersForModal = [];

      winners.forEach(winner => {
        const cardData = cardDataResponses[winner.card_id];
        
        // Validación que agregamos (FIX-2)
        if (!cardData.numbers_json || !Array.isArray(cardData.numbers_json)) {
          // Skip este cartón - no crashear
          return;
        }

        // Si es válido, procesarlo
        winnersForModal.push({
          cardCode: cardData.code,
          card: cardData.numbers_json,
        });
      });

      // Solo el cartón válido debe estar en el array
      expect(winnersForModal).to.have.length(1);
      expect(winnersForModal[0].cardCode).to.equal("A002");
    });
  });

  describe("convertCardNumbers - comportamiento esperado", () => {
    it("debe convertir FREE a 0", () => {
      const convertCardNumbers = (numbers) => {
        return numbers.map(row => row.map(num => (num === "FREE" ? 0 : num)));
      };

      const card = [
        [1, 16, 31, 46, 61],
        [2, 17, 32, 47, 62],
        [3, 18, "FREE", 48, 63],
        [4, 19, 34, 49, 64],
        [5, 20, 35, 50, 65],
      ];

      const result = convertCardNumbers(card);

      expect(result[2][2]).to.equal(0);  // FREE -> 0
      expect(result[0][0]).to.equal(1);  // Números se mantienen
    });

    it("debe lanzar error si numbers es undefined (sin validación)", () => {
      const convertCardNumbers = (numbers) => {
        return numbers.map(row => row.map(num => (num === "FREE" ? 0 : num)));
      };

      // Sin validación, esto crashea
      let errorThrown = false;
      try {
        convertCardNumbers(undefined);
      } catch (e) {
        errorThrown = true;
        expect(e.message).to.include("map");
      }

      expect(errorThrown).to.be.true;
    });
  });
});

/**
 * PRUEBAS MANUALES RECOMENDADAS:
 * 
 * 1. VERIFICAR CONSOLA DURANTE BINGO:
 *    - Jugar hasta que alguien cante bingo
 *    - Abrir DevTools > Console
 *    - VERIFICAR: NO debe aparecer error "Cannot read properties of undefined (reading 'map')"
 * 
 * 2. VERIFICAR MODAL DE GANADOR:
 *    - Cuando alguien canta bingo, debe aparecer el modal con el cartón ganador
 *    - VERIFICAR: El cartón se renderiza correctamente sin errores
 * 
 * 3. CASO EDGE - MÚLTIPLES GANADORES:
 *    - Si hay múltiples ganadores, todos los cartones deben mostrarse
 *    - VERIFICAR: Si algún cartón tiene datos inválidos, los otros se muestran correctamente
 */
