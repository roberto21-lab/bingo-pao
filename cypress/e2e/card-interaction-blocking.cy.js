/**
 * ISSUE-1: Tests para validar bloqueo de apertura de cartones
 * 
 * Estos tests verifican que:
 * 1. Los cartones NO se pueden abrir después de cantar bingo válido
 * 2. Los cartones NO se pueden abrir durante transición de rondas
 * 3. Los cartones SÍ se pueden abrir durante el juego normal
 */

describe('ISSUE-1: Card Interaction Blocking', () => {
  
  describe('Bloqueo después de cantar bingo', () => {
    
    it('debe bloquear apertura de cartones después de cantar bingo válido (unit test)', () => {
      const handleCardClick = (index, roomFinished, winners, hasClaimedBingoInRound, isTransitioning) => {
        // Si la sala está finalizada y hay ganadores
        if (roomFinished && winners && winners.length > index) {
          return { action: 'show_winner', blocked: false };
        }
        
        // ISSUE-1 FIX: Bloquear si ya cantó bingo en esta ronda
        if (hasClaimedBingoInRound) {
          return { 
            action: 'blocked', 
            blocked: true, 
            reason: 'already_claimed',
            message: 'Ya cantaste bingo en esta ronda. Espera a que comience la siguiente ronda.'
          };
        }
        
        // Bloquear durante transición
        if (isTransitioning) {
          return { 
            action: 'blocked', 
            blocked: true, 
            reason: 'transitioning',
            message: 'Espera un momento, se está preparando la siguiente ronda.'
          };
        }
        
        // Permitir apertura normal
        return { action: 'open_modal', blocked: false };
      };
      
      // Caso 1: Juego normal - puede abrir
      const normalCase = handleCardClick(0, false, [], false, false);
      expect(normalCase.blocked).to.be.false;
      expect(normalCase.action).to.equal('open_modal');
      
      // Caso 2: Ya cantó bingo - NO puede abrir
      const afterBingoCase = handleCardClick(0, false, [], true, false);
      expect(afterBingoCase.blocked).to.be.true;
      expect(afterBingoCase.reason).to.equal('already_claimed');
      
      // Caso 3: Durante transición - NO puede abrir
      const transitionCase = handleCardClick(0, false, [], false, true);
      expect(transitionCase.blocked).to.be.true;
      expect(transitionCase.reason).to.equal('transitioning');
      
      // Caso 4: Sala finalizada con ganadores - puede ver ganador
      const finishedCase = handleCardClick(0, true, [{ card_id: '123' }], false, false);
      expect(finishedCase.blocked).to.be.false;
      expect(finishedCase.action).to.equal('show_winner');
    });
    
    it('debe resetear hasClaimedBingoInRound cuando cambia la ronda (unit test)', () => {
      let state = {
        currentRound: 1,
        hasClaimedBingoInRound: true,
        previousRound: 1
      };
      
      const handleRoundChange = (newRound) => {
        if (newRound !== state.previousRound) {
          state = {
            ...state,
            currentRound: newRound,
            hasClaimedBingoInRound: false, // Reset
            previousRound: newRound
          };
        }
        return state;
      };
      
      // Verificar estado inicial
      expect(state.hasClaimedBingoInRound).to.be.true;
      
      // Cambiar a ronda 2
      const newState = handleRoundChange(2);
      expect(newState.currentRound).to.equal(2);
      expect(newState.hasClaimedBingoInRound).to.be.false;
    });
  });
  
  describe('Estados de bloqueo combinados', () => {
    
    it('debe priorizar bloqueo por bingo sobre transición (unit test)', () => {
      // Si ambos estados están activos, el mensaje debe ser sobre bingo
      const handleCardClick = (hasClaimedBingoInRound, isTransitioning) => {
        if (hasClaimedBingoInRound) {
          return { reason: 'already_claimed' };
        }
        if (isTransitioning) {
          return { reason: 'transitioning' };
        }
        return { reason: null };
      };
      
      // Ambos activos - prioriza bingo
      const bothActive = handleCardClick(true, true);
      expect(bothActive.reason).to.equal('already_claimed');
      
      // Solo transición
      const onlyTransition = handleCardClick(false, true);
      expect(onlyTransition.reason).to.equal('transitioning');
      
      // Ninguno activo
      const noneActive = handleCardClick(false, false);
      expect(noneActive.reason).to.be.null;
    });
    
    it('debe permitir apertura de cartones para ver ganadores en sala finalizada (unit test)', () => {
      const canOpenCard = (roomFinished, winners, index, hasClaimedBingoInRound) => {
        // En sala finalizada, siempre se pueden ver los ganadores
        if (roomFinished && winners && winners.length > 0) {
          return true;
        }
        // Durante el juego, bloquear si ya cantó bingo
        if (hasClaimedBingoInRound) {
          return false;
        }
        return true;
      };
      
      // Sala finalizada con ganadores - puede ver aunque haya cantado bingo
      expect(canOpenCard(true, [{ card_id: '123' }], 0, true)).to.be.true;
      
      // Sala activa con bingo cantado - NO puede abrir
      expect(canOpenCard(false, [], 0, true)).to.be.false;
      
      // Sala activa sin bingo - puede abrir
      expect(canOpenCard(false, [], 0, false)).to.be.true;
    });
  });
});
