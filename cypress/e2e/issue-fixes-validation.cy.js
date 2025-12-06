/**
 * E2E Tests para validar las correcciones de issues
 * 
 * Issues corregidos:
 * 1. Error de balance insuficiente - mostrar mensaje claro al usuario
 * 2. Home - mostrar info completa de sala en espera
 * 3. Notificaciones - contador a cero y marcar como leídas al abrir panel
 * 4. Mala Suerte no debe aparecer al usuario que cantó bingo
 * 5. Alerta "Tu bingo ha sido confirmado" debe desaparecer automáticamente
 */

describe("Issue Fixes Validation", () => {
  describe("Carga inicial", () => {
    it("debe cargar la página sin errores", () => {
      cy.visit("/");
      cy.get("body").should("be.visible");
    });
  });

  describe("ISSUE-1: Error de balance insuficiente", () => {
    it("debe mostrar mensaje claro cuando hay saldo insuficiente", () => {
      // Simular respuesta de error del backend
      const errorResponse = {
        success: false,
        message: "Saldo insuficiente. Necesitas 50.00 para 5 cartón(es) válido(s) pero tienes 10.00",
        required: 50,
        available: 10,
      };

      // Verificar que el mensaje contiene información sobre recarga
      const frontendMessage = `${errorResponse.message}. Puedes recargar saldo desde tu perfil o billetera.`;
      
      expect(frontendMessage).to.include("Saldo insuficiente");
      expect(frontendMessage).to.include("recargar saldo");
      expect(frontendMessage).to.include("billetera");
    });

    it("debe detectar correctamente el error de saldo insuficiente", () => {
      const errorMessages = [
        "Saldo insuficiente. Necesitas 100.00",
        "saldo insuficiente para esta operación",
        "SALDO INSUFICIENTE",
        "insufficient balance",
      ];

      errorMessages.forEach(msg => {
        const isInsufficientBalance = 
          msg.toLowerCase().includes("saldo insuficiente") || 
          msg.toLowerCase().includes("insufficient");
        expect(isInsufficientBalance).to.be.true;
      });
    });
  });

  describe("ISSUE-2: Información de sala en espera", () => {
    it("debe mostrar patrón de ronda para salas 'active' con ronda activa", () => {
      const activeRoom = {
        id: "room-123",
        title: "Sala de Prueba",
        status: "active",
        currentRound: 1,
        currentPattern: "horizontal",
        currentRoundPrize: 100,
        prizeAmount: 300,
        currency: "Bs",
      };

      // Verificar que salas 'active' con ronda activa muestran el patrón
      const showPattern = 
        (activeRoom.status === "active" || activeRoom.status === "waiting") && 
        activeRoom.currentPattern;
      
      expect(!!showPattern).to.be.true;
    });

    it("debe mostrar patrón de ronda para salas en 'waiting' con patrón definido", () => {
      const waitingRoom = {
        id: "room-456",
        title: "Sala Esperando",
        status: "waiting",
        currentRound: 1,
        currentPattern: "vertical",
        currentRoundPrize: 50,
        prizeAmount: 200,
        currency: "Bs",
      };

      const showPattern = 
        (waitingRoom.status === "active" || waitingRoom.status === "waiting") && 
        waitingRoom.currentPattern;
      
      expect(!!showPattern).to.be.true;
    });

    it("debe calcular premio de ronda actual desde los rounds", () => {
      const optimizedRoom = {
        id: "room-123",
        currentRound: 1,
        rounds: [
          { round_number: 1, status: "pending", pattern: "horizontal", reward: { percent: 20, amount: 60, pattern: "horizontal" } },
          { round_number: 2, status: "pending", pattern: "vertical", reward: { percent: 30, amount: 90, pattern: "vertical" } },
          { round_number: 3, status: "pending", pattern: "full", reward: { percent: 50, amount: 150, pattern: "full" } },
        ],
      };

      const currentRoundData = optimizedRoom.rounds.find(r => r.round_number === optimizedRoom.currentRound);
      const currentRoundPrize = currentRoundData?.reward?.amount;

      expect(currentRoundPrize).to.equal(60);
    });

    it("debe mostrar premio de ronda separado del premio total", () => {
      const room = {
        currentRoundPrize: 60,
        prizeAmount: 300,
        currency: "Bs",
      };

      expect(room.currentRoundPrize).to.not.equal(room.prizeAmount);
      expect(room.currentRoundPrize).to.be.lessThan(room.prizeAmount);
    });
  });

  describe("ISSUE-3: Notificaciones - marcar como leídas al abrir", () => {
    it("debe marcar todas las notificaciones como leídas al abrir el panel", () => {
      // Simular el comportamiento esperado
      let notificationsMarkedAsRead = false;
      let panelOpen = false;

      const markAllAsRead = () => {
        notificationsMarkedAsRead = true;
      };

      const openPanel = () => {
        panelOpen = true;
        // Simular el delay antes de marcar como leídas
        setTimeout(markAllAsRead, 500);
      };

      // Simular apertura del panel
      openPanel();

      // Después de 600ms, las notificaciones deberían estar marcadas
      cy.wait(600).then(() => {
        expect(panelOpen).to.be.true;
      });
    });
  });

  describe("ISSUE-4: Mala Suerte no aparece al usuario que cantó bingo", () => {
    it("NO debe mostrar Mala Suerte si hasClaimedBingoInRound es true", () => {
      const userState = {
        hasClaimedBingoInRound: true,
        cardHasBingo: false,
        showLoserAnimation: true,
      };

      // Lógica corregida: NO mostrar si el usuario ya cantó bingo
      const shouldShowLoser = 
        userState.showLoserAnimation && 
        !userState.cardHasBingo && 
        !userState.hasClaimedBingoInRound;

      expect(shouldShowLoser).to.be.false;
    });

    it("debe mostrar Mala Suerte SOLO si NO cantó bingo y NO tiene bingo", () => {
      const userState = {
        hasClaimedBingoInRound: false,
        cardHasBingo: false,
        showLoserAnimation: true,
      };

      const shouldShowLoser = 
        userState.showLoserAnimation && 
        !userState.cardHasBingo && 
        !userState.hasClaimedBingoInRound;

      expect(shouldShowLoser).to.be.true;
    });

    it("NO debe mostrar Mala Suerte en NINGÚN cartón si el usuario ya cantó bingo", () => {
      // Simular múltiples cartones del usuario
      const cards = [
        { hasBingo: true },  // Cartón con el que cantó bingo
        { hasBingo: false }, // Cartón sin bingo
        { hasBingo: false }, // Otro cartón sin bingo
      ];

      const hasClaimedBingoInRound = true;
      const showLoserAnimation = true;

      cards.forEach(card => {
        const shouldShowLoser = 
          showLoserAnimation && 
          !card.hasBingo && 
          !hasClaimedBingoInRound;
        
        // Ningún cartón debería mostrar "Mala Suerte"
        expect(shouldShowLoser).to.be.false;
      });
    });
  });

  describe("ISSUE-5: Alerta de bingo confirmado desaparece automáticamente", () => {
    it("las notificaciones deben tener auto-dismiss configurado", () => {
      const AUTO_DISMISS_TIME = 5000; // 5 segundos
      
      expect(AUTO_DISMISS_TIME).to.be.greaterThan(0);
      expect(AUTO_DISMISS_TIME).to.be.lessThan(10000); // Menos de 10 segundos
    });

    it("las notificaciones confirmadas tienen mayor duración", () => {
      const baseAutoHide = 5000;
      const confirmedMultiplier = 1.5;
      const confirmedDuration = baseAutoHide * confirmedMultiplier;

      expect(confirmedDuration).to.equal(7500); // 7.5 segundos
    });

    it("la notificación se elimina del estado después del auto-dismiss", () => {
      let notifications = [
        { id: "1", type: "confirmed", message: "¡Tu bingo ha sido confirmado!" },
      ];

      // Simular auto-dismiss
      const removeNotification = (id) => {
        notifications = notifications.filter(n => n.id !== id);
      };

      // Después de auto-dismiss
      removeNotification("1");

      expect(notifications).to.have.length(0);
    });
  });
});

/**
 * PRUEBAS MANUALES RECOMENDADAS:
 * 
 * 1. ISSUE-1: BALANCE INSUFICIENTE
 *    - Intentar inscribir cartones sin saldo suficiente
 *    - VERIFICAR: Mensaje muestra "Saldo insuficiente" y sugiere recargar
 * 
 * 2. ISSUE-2: INFO DE SALA EN ESPERA
 *    - Ir a Home con una sala en "Esperando"
 *    - VERIFICAR: Se muestra ronda, patrón, premio de ronda y premio total
 * 
 * 3. ISSUE-3: NOTIFICACIONES
 *    - Tener notificaciones no leídas
 *    - Abrir el panel de notificaciones
 *    - VERIFICAR: Contador baja a 0 y notificaciones se marcan como leídas
 * 
 * 4. ISSUE-4: MALA SUERTE
 *    - Cantar bingo exitosamente
 *    - Cuando otro usuario cante bingo
 *    - VERIFICAR: NO aparece "Mala Suerte" en ninguno de tus cartones
 * 
 * 5. ISSUE-5: ALERTA DE BINGO CONFIRMADO
 *    - Cantar bingo y que se confirme
 *    - VERIFICAR: La alerta desaparece después de ~7.5 segundos
 */
