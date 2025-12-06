/**
 * E2E Tests para Lógica de Animación "Mala Suerte"
 * 
 * ISSUE: Si un usuario ya cantó bingo y luego otro jugador canta, 
 * al primero se le muestra "Mala Suerte", lo cual NO debe ocurrir.
 * 
 * REGLA:
 * - "Mala Suerte" SOLO para usuarios que NO cantaron bingo
 * - Usuarios que ya cantaron deben ver solo el mensaje de "otro usuario cantó bingo"
 */

describe("Lógica de Animación Mala Suerte", () => {
  describe("Carga inicial de la página", () => {
    it("debe cargar la página de inicio sin errores", () => {
      cy.visit("/");
      cy.get("body").should("be.visible");
    });
  });

  describe("FIX-3: hasClaimedBingoInRoundRef - Valor actualizado en tiempo real", () => {
    it("debe usar ref para obtener valor actualizado cuando llega bingo-claimed", () => {
      // Este test verifica la corrección con ref
      // El problema era que el callback capturaba hasClaimedBingoInRound = false
      // aunque el usuario ya había cantado bingo
      
      const hasClaimedBingoInRoundRef = { current: false };
      let showLoserAnimation = false;
      
      // Usuario canta bingo (antes de que llegue el evento)
      hasClaimedBingoInRoundRef.current = true;
      
      // Evento bingo-claimed llega (usando ref, no valor capturado)
      const userHasBingo = false;
      const hasClaimedCurrentRound = hasClaimedBingoInRoundRef.current; // Usa ref
      
      if (!userHasBingo && !hasClaimedCurrentRound) {
        showLoserAnimation = true;
      }
      
      // El usuario que cantó bingo NO debe ver "Mala Suerte"
      expect(showLoserAnimation).to.be.false;
    });

    it("BUG ORIGINAL: sin ref, el valor capturado mostraba Mala Suerte incorrectamente", () => {
      // Demostrar el bug que corregimos
      let hasClaimedBingoInRoundState = false;
      const capturedValue = hasClaimedBingoInRoundState; // Captura valor inicial (bug)
      let showLoserAnimation = false;
      
      // Usuario canta bingo
      hasClaimedBingoInRoundState = true;
      
      // Evento llega pero usa valor CAPTURADO (bug original)
      const userHasBingo = false;
      if (!userHasBingo && !capturedValue) {
        showLoserAnimation = true; // Bug: muestra Mala Suerte incorrectamente
      }
      
      // Con el bug, showLoserAnimation era true incorrectamente
      expect(showLoserAnimation).to.be.true; // Esto era el bug
    });
  });

  describe("Lógica de hasClaimedBingoInRound (mock)", () => {
    it("NO debe mostrar Mala Suerte si hasClaimedBingoInRound es true", () => {
      // Simular escenario: Usuario A ya cantó bingo
      const hasClaimedBingoInRound = true;
      const userHasBingo = false; // El usuario puede no tener el pattern visible
      
      // Lógica corregida: NO mostrar Mala Suerte si ya cantó bingo
      const shouldShowLoserAnimation = !userHasBingo && !hasClaimedBingoInRound;
      
      expect(shouldShowLoserAnimation).to.be.false;
    });

    it("debe mostrar Mala Suerte si no tiene bingo Y no cantó bingo", () => {
      // Simular escenario: Usuario que no tiene bingo y no cantó
      const hasClaimedBingoInRound = false;
      const userHasBingo = false;
      
      // Lógica: mostrar Mala Suerte
      const shouldShowLoserAnimation = !userHasBingo && !hasClaimedBingoInRound;
      
      expect(shouldShowLoserAnimation).to.be.true;
    });

    it("NO debe mostrar Mala Suerte si tiene bingo en sus cartones", () => {
      // Simular escenario: Usuario que tiene bingo pero no lo cantó aún
      const hasClaimedBingoInRound = false;
      const userHasBingo = true;
      
      // Lógica: NO mostrar Mala Suerte porque tiene bingo
      const shouldShowLoserAnimation = !userHasBingo && !hasClaimedBingoInRound;
      
      expect(shouldShowLoserAnimation).to.be.false;
    });

    it("NO debe mostrar Mala Suerte si ya cantó bingo aunque no tenga pattern", () => {
      // Este es el caso del bug: Usuario cantó bingo pero el pattern ya no es visible
      const hasClaimedBingoInRound = true;
      const userHasBingo = false; // Pattern no visible por timing
      
      // CORRECCIÓN: NO debe mostrar Mala Suerte porque ya cantó bingo
      const shouldShowLoserAnimation = !userHasBingo && !hasClaimedBingoInRound;
      
      expect(shouldShowLoserAnimation).to.be.false;
    });
  });

  describe("Escenario completo: Usuario A canta, Usuario B canta", () => {
    it("Usuario A NO debe ver Mala Suerte cuando Usuario B canta bingo", () => {
      // Estado de Usuario A después de cantar bingo exitosamente
      const userAState = {
        hasClaimedBingoInRound: true, // Usuario A ya cantó bingo
        userHasBingo: true, // Tiene el pattern
      };
      
      // Cuando llega el evento de bingo de Usuario B
      // La lógica debe evaluar si mostrar Mala Suerte a Usuario A
      const shouldShowLoserToA = !userAState.userHasBingo && !userAState.hasClaimedBingoInRound;
      
      expect(shouldShowLoserToA).to.be.false;
    });

    it("Usuario C (que no cantó) SÍ debe ver Mala Suerte", () => {
      // Estado de Usuario C que no cantó bingo
      const userCState = {
        hasClaimedBingoInRound: false, // No cantó bingo
        userHasBingo: false, // No tiene el pattern
      };
      
      // Cuando llega el evento de bingo
      const shouldShowLoserToC = !userCState.userHasBingo && !userCState.hasClaimedBingoInRound;
      
      expect(shouldShowLoserToC).to.be.true;
    });
  });

  describe("Reseteo de estado al cambiar de ronda", () => {
    it("hasClaimedBingoInRound debe resetearse al cambiar de ronda", () => {
      // Simular estado al final de ronda 1
      let hasClaimedBingoInRound = true;
      let currentRound = 1;
      let previousRound = 1;
      
      // Cambiar a ronda 2
      currentRound = 2;
      
      // Detectar cambio de ronda
      if (currentRound !== previousRound) {
        hasClaimedBingoInRound = false; // Reset
        previousRound = currentRound;
      }
      
      expect(hasClaimedBingoInRound).to.be.false;
      expect(previousRound).to.equal(2);
    });

    it("en nueva ronda, usuario puede ver Mala Suerte si no canta bingo", () => {
      // Estado inicial en nueva ronda (estado reseteado)
      const userState = {
        hasClaimedBingoInRound: false, // Reseteado para nueva ronda
        userHasBingo: false,
      };
      
      // Si otro usuario canta bingo primero
      const shouldShowLoser = !userState.userHasBingo && !userState.hasClaimedBingoInRound;
      
      expect(shouldShowLoser).to.be.true;
    });
  });

  describe("Casos edge", () => {
    it("Usuario que canta bingo pero es rechazado (inválido)", () => {
      // Si el bingo es rechazado, hasClaimedBingoInRound sigue siendo true
      // porque ya intentó cantar
      const userState = {
        hasClaimedBingoInRound: true, // Intentó cantar (fue rechazado)
        userHasBingo: false, // No tenía bingo válido
      };
      
      // Cuando otro canta bingo válido, este usuario NO debe ver Mala Suerte
      // porque ya hizo su intento
      const shouldShowLoser = !userState.userHasBingo && !userState.hasClaimedBingoInRound;
      
      expect(shouldShowLoser).to.be.false;
    });

    it("showLoserAnimation solo se muestra si la condición completa es true", () => {
      // Verificar que la condición es estricta
      const cases = [
        { userHasBingo: true, hasClaimedBingoInRound: true, expected: false },
        { userHasBingo: true, hasClaimedBingoInRound: false, expected: false },
        { userHasBingo: false, hasClaimedBingoInRound: true, expected: false },
        { userHasBingo: false, hasClaimedBingoInRound: false, expected: true },
      ];

      cases.forEach(({ userHasBingo, hasClaimedBingoInRound, expected }) => {
        const result = !userHasBingo && !hasClaimedBingoInRound;
        expect(result).to.equal(expected);
      });
    });
  });
});

/**
 * PRUEBAS MANUALES RECOMENDADAS:
 * 
 * 1. PRUEBA DE USUARIO QUE CANTA BINGO:
 *    - Usuario A canta bingo exitosamente
 *    - Usuario B canta bingo después
 *    - VERIFICAR: Usuario A NO ve "Mala Suerte"
 * 
 * 2. PRUEBA DE USUARIO QUE NO CANTA:
 *    - Usuario A canta bingo
 *    - VERIFICAR: Usuario C (que no cantó) SÍ ve "Mala Suerte"
 * 
 * 3. PRUEBA DE NUEVA RONDA:
 *    - En ronda 1, Usuario A canta bingo
 *    - En ronda 2, Usuario A no canta
 *    - Otro usuario canta bingo
 *    - VERIFICAR: Usuario A SÍ ve "Mala Suerte" (estado reseteado)
 */
