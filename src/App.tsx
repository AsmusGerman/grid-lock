import { createStore } from 'solid-js/store';
import { createSignal } from 'solid-js';
import { onMount, onCleanup } from 'solid-js';
import { GameSession } from './nexus/session/GameSession';
import { GameService } from './services/GameService';
import type { GameStateDetail } from './nexus/events';
import { GAME_ERROR_EVENT, GAME_STATE_EVENT } from './nexus/events';
import { ErrorToast } from './ui/ErrorToast';
import { HintPanel } from './ui/HintPanel';
import { ScorePanel } from './ui/ScorePanel';
import { TurnControls } from './ui/TurnControls';
import { TurnIndicator } from './ui/TurnIndicator';

type BoardSize = 5 | 7 | 9;

const DEFAULT_BOARD_SIZE: BoardSize = 7;
const MAX_TURNS_BY_SIZE: Record<BoardSize, number> = {
  5: 24,
  7: 40,
  9: 60,
};

interface AppState extends GameStateDetail {
  errorMessage: string | null;
}

const initialState: AppState = {
  currentPlayer: 'P1',
  turnCount: 0,
  maxTurns: MAX_TURNS_BY_SIZE[DEFAULT_BOARD_SIZE],
  actionableNodes: 0,
  scores: { P1: 0, P2: 0 },
  phases: { P1: 'Placement', P2: 'Placement' },
  moveLog: [],
  canUndo: false,
  canReady: false,
  canSurrender: false,
  winner: null,
  isGameOver: false,
  errorMessage: null,
};

function boardMessage(state: AppState): string {
  if (state.errorMessage) return state.errorMessage;
  if (state.phases[state.currentPlayer] === 'Placement') {
    return 'Placement: P1 must start in top-left zone and P2 in bottom-right zone. Middle diagonal is forbidden.';
  }
  return 'Double-click your own straight dead-end leaf to convert it into X and retract that leaf path.';
}

export function App() {
  const [state, setState] = createStore<AppState>({ ...initialState });
  const [nextBoardSize, setNextBoardSize] = createSignal<BoardSize>(DEFAULT_BOARD_SIZE);
  const [showNewGameModal, setShowNewGameModal] = createSignal(false);
  const [showHintModal, setShowHintModal] = createSignal(false);
  let boardRef!: HTMLDivElement;
  let gameService: GameService | null = null;

  async function startNewGame(size: BoardSize = nextBoardSize()) {
    const maxTurns = MAX_TURNS_BY_SIZE[size];
    gameService?.destroy();
    const session = new GameSession({ cols: size, rows: size, maxTurns });
    gameService = new GameService(session);
    await gameService.mount(boardRef);
    setState({ ...initialState, maxTurns });
  }

  function openNewGameModal(): void {
    setShowNewGameModal(true);
  }

  function cancelNewGame(): void {
    setShowNewGameModal(false);
  }

  function openHintModal(): void {
    setShowHintModal(true);
  }

  function closeHintModal(): void {
    setShowHintModal(false);
  }

  async function confirmNewGame(): Promise<void> {
    await startNewGame(nextBoardSize());
    setShowNewGameModal(false);
  }

  onMount(async () => {
    const initialSize = nextBoardSize();
    const session = new GameSession({
      cols: initialSize,
      rows: initialSize,
      maxTurns: MAX_TURNS_BY_SIZE[initialSize],
    });
    gameService = new GameService(session);
    await gameService.mount(boardRef);

    const onState = (e: CustomEvent<GameStateDetail>) => {
      setState({ ...e.detail, errorMessage: null });
    };

    const onError = (e: CustomEvent<string>) => {
      setState('errorMessage', e.detail);
    };

    window.addEventListener(GAME_STATE_EVENT, onState);
    window.addEventListener(GAME_ERROR_EVENT, onError);

    onCleanup(() => {
      window.removeEventListener(GAME_STATE_EVENT, onState);
      window.removeEventListener(GAME_ERROR_EVENT, onError);
      gameService?.destroy();
    });
  });

  return (
    <div id="app">
      <header class="top-header">
        <div class="top-header-main">
          <TurnIndicator state={state} />
          <ScorePanel
            scores={state.scores}
            phases={state.phases}
            currentPlayer={state.currentPlayer}
          />
        </div>
        <button
          type="button"
          class="btn hint-trigger"
          aria-label="Open game hints"
          onClick={openHintModal}
        >
          <span aria-hidden="true">ⓘ</span>
        </button>
      </header>

      <div id="board">
        <ErrorToast message={boardMessage(state)} />
        <div ref={boardRef} class="board-canvas-slot" />
      </div>

      <div id="panel">
        <TurnControls
          canUndo={state.canUndo}
          canReady={state.canReady}
          canSurrender={state.canSurrender}
          onUndo={() => gameService?.undoLastMove()}
          onReady={() => gameService?.finishTurn()}
          onSurrender={() => gameService?.surrenderCurrentPlayer()}
          onNewGame={openNewGameModal}
        />

        <section class="card log-panel">
          <h3>MOVES</h3>
          <ul class="log-list">
            {[...state.moveLog].reverse().map(entry => (
              <li class={`log-entry ${entry.player.toLowerCase()}`}>
                <span class="log-dot" />
                <span class="log-text">{entry.label}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <HintPanel isOpen={showHintModal()} onClose={closeHintModal} />

      {showNewGameModal() && (
        <div class="modal-backdrop" role="presentation">
          <div class="modal-card" role="dialog" aria-modal="true" aria-label="New game settings">
            <h3>START NEW GAME</h3>
            <p>Choose the board size for the next match.</p>
            <div class="size-picker-row">
              <label for="new-game-size">Grid</label>
              <select
                id="new-game-size"
                value={String(nextBoardSize())}
                onChange={(e) => setNextBoardSize(Number(e.currentTarget.value) as BoardSize)}
              >
                <option value="5">5 x 5</option>
                <option value="7">7 x 7</option>
                <option value="9">9 x 9</option>
              </select>
              <span>{`Turns: ${MAX_TURNS_BY_SIZE[nextBoardSize()]}`}</span>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-light" onClick={cancelNewGame}>Cancel</button>
              <button type="button" class="btn btn-primary" onClick={() => void confirmNewGame()}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
