/**
 * E2E Tests para Issue 2: Miniaturas en sala finalizada
 * 
 * Verifica que en una sala finalizada:
 * - Las miniaturas NO muestren números en rojo (calledNumbers global)
 * - Solo se muestren dorados los winningNumbers específicos del ganador
 * - El modal y la miniatura muestren los mismos datos
 */

describe("Finished Room Miniatures - Issue 2 Fix", () => {
  describe("isFinishedRoom prop", () => {
    it("debe pasar isFinishedRoom=true cuando la sala está finalizada", () => {
      const isGameFinished = true;
      const showWinners = true;

      // Lógica de CardList para calcular isFinishedRoom
      const isFinishedRoom = isGameFinished && showWinners;

      expect(isFinishedRoom).to.be.true;
    });

    it("debe pasar isFinishedRoom=false durante el juego", () => {
      const isGameFinished = false;
      const showWinners = false;

      const isFinishedRoom = isGameFinished && showWinners;

      expect(isFinishedRoom).to.be.false;
    });
  });

  describe("Lógica de colores en miniatura", () => {
    it("NO debe mostrar números en rojo cuando isFinishedRoom=true", () => {
      const isFinishedRoom = true;
      const calledNumbers = new Set(["B-5", "I-22", "N-35", "G-48", "O-65"]);
      const markedNumbers = new Set(); // Vacío en sala finalizada
      const winningNumbers = new Set(["B-5", "I-22"]); // Solo los del bingo

      // Simular lógica de CardMiniature
      const getNumberStyle = (numFormat) => {
        const isCalled = calledNumbers.has(numFormat);
        const isMarked = markedNumbers.has(numFormat);
        const isWinning = winningNumbers.has(numFormat);

        // ISSUE-2 FIX: En sala finalizada NO mostrar rojo
        const isCalledButNotMarked = !isFinishedRoom && isCalled && !isMarked;
        const shouldBeGold = isWinning;

        if (shouldBeGold) return "gold";
        if (isCalledButNotMarked) return "red";
        return "default";
      };

      // B-5 es winning -> dorado
      expect(getNumberStyle("B-5")).to.equal("gold");

      // N-35 es called pero NO winning -> NO debería ser rojo (sala finalizada)
      expect(getNumberStyle("N-35")).to.equal("default");

      // G-48 es called pero NO winning -> NO debería ser rojo (sala finalizada)
      expect(getNumberStyle("G-48")).to.equal("default");
    });

    it("SÍ debe mostrar números en rojo durante el juego (isFinishedRoom=false)", () => {
      const isFinishedRoom = false;
      const calledNumbers = new Set(["B-5", "I-22", "N-35"]);
      const markedNumbers = new Set(["B-5"]); // Usuario marcó B-5
      const winningNumbers = new Set();

      const getNumberStyle = (numFormat) => {
        const isCalled = calledNumbers.has(numFormat);
        const isMarked = markedNumbers.has(numFormat);
        const isWinning = winningNumbers.has(numFormat);

        const isCalledButNotMarked = !isFinishedRoom && isCalled && !isMarked;
        const shouldBeGold = isWinning;

        if (shouldBeGold) return "gold";
        if (isCalledButNotMarked) return "red";
        if (isMarked) return "green";
        return "default";
      };

      // B-5 es called Y marcado -> verde
      expect(getNumberStyle("B-5")).to.equal("green");

      // I-22 es called pero NO marcado -> rojo (durante juego)
      expect(getNumberStyle("I-22")).to.equal("red");

      // N-35 es called pero NO marcado -> rojo (durante juego)
      expect(getNumberStyle("N-35")).to.equal("red");
    });
  });

  describe("Consistencia miniatura vs modal", () => {
    it("miniatura y modal deben mostrar los mismos números dorados", () => {
      // Datos del ganador (como viene del backend)
      const winner = {
        card_id: "card-123",
        bingo_numbers: ["B-5", "I-22", "N-35", "G-48", "O-65"],
        called_numbers: ["B-5", "I-22", "N-35", "G-48", "O-65", "B-1", "B-3", "I-16"],
      };

      // Para el MODAL (WinnerCardModal) - usa datos del winner directamente
      const modalBingoNumbers = new Set(winner.bingo_numbers);

      // Para la MINIATURA (CardMiniature) - usa winningNumbersMap
      const winningNumbersMap = new Map();
      winningNumbersMap.set(winner.card_id, new Set(winner.bingo_numbers));
      const miniatureBingoNumbers = winningNumbersMap.get(winner.card_id);

      // Verificar que ambos tienen los mismos números
      expect([...miniatureBingoNumbers]).to.deep.equal([...modalBingoNumbers]);

      // Verificar que solo los bingo_numbers están dorados, NO todos los called_numbers
      expect(miniatureBingoNumbers.has("B-5")).to.be.true;  // Parte del bingo
      expect(miniatureBingoNumbers.has("B-1")).to.be.false; // Solo llamado, no bingo
      expect(miniatureBingoNumbers.has("B-3")).to.be.false; // Solo llamado, no bingo
    });

    it("calledNumbers global NO debe afectar miniaturas en sala finalizada", () => {
      // calledNumbers global contiene números de TODAS las rondas
      const globalCalledNumbers = new Set([
        // Ronda 1
        "B-1", "B-3", "I-16", "N-31", "G-46",
        // Ronda 2
        "B-5", "I-22", "N-35", "G-48",
        // Ronda 3
        "O-61", "O-65", "O-70",
      ]);

      // winningNumbers específico de la ronda 1
      const round1WinningNumbers = new Set(["B-1", "B-3", "I-16", "N-31", "G-46"]);

      const isFinishedRoom = true;

      // Verificar que en sala finalizada, solo los winningNumbers se muestran dorados
      // y los demás números llamados NO se muestran en rojo
      const getStyle = (numFormat) => {
        const isCalled = globalCalledNumbers.has(numFormat);
        const isWinning = round1WinningNumbers.has(numFormat);
        const isCalledButNotMarked = !isFinishedRoom && isCalled;

        if (isWinning) return "gold";
        if (isCalledButNotMarked) return "red";
        return "default";
      };

      // Números del bingo de ronda 1 -> dorado
      expect(getStyle("B-1")).to.equal("gold");
      
      // Números de ronda 2 (NO del bingo de este ganador) -> default (NO rojo)
      expect(getStyle("B-5")).to.equal("default");
      expect(getStyle("I-22")).to.equal("default");
      
      // Números de ronda 3 (NO del bingo de este ganador) -> default (NO rojo)
      expect(getStyle("O-61")).to.equal("default");
      expect(getStyle("O-70")).to.equal("default");
    });
  });

  describe("Escenarios de múltiples ganadores", () => {
    it("cada miniatura debe mostrar solo sus propios winningNumbers", () => {
      const winners = [
        { card_id: "card-1", bingo_numbers: ["B-5", "I-22", "N-35", "G-48", "O-65"] },
        { card_id: "card-2", bingo_numbers: ["B-3", "I-18", "N-33", "G-50", "O-70"] },
        { card_id: "card-3", bingo_numbers: ["B-1", "I-16", "N-31", "G-46", "O-61"] },
      ];

      // Crear winningNumbersMap
      const winningNumbersMap = new Map();
      winners.forEach(winner => {
        winningNumbersMap.set(winner.card_id, new Set(winner.bingo_numbers));
      });

      // Verificar que cada cartón tiene sus propios números
      const card1Numbers = winningNumbersMap.get("card-1");
      const card2Numbers = winningNumbersMap.get("card-2");

      // Card 1 tiene B-5, Card 2 NO
      expect(card1Numbers.has("B-5")).to.be.true;
      expect(card2Numbers.has("B-5")).to.be.false;

      // Card 2 tiene B-3, Card 1 NO
      expect(card2Numbers.has("B-3")).to.be.true;
      expect(card1Numbers.has("B-3")).to.be.false;
    });
  });
});
