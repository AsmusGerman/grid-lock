import { createStore } from 'solid-js/store';
import { onMount, onCleanup } from 'solid-js';
import { GameSession } from './nexus/session/GameSession';
import { GameService } from './services/GameService';
import type { GameStateDetail } from './nexus/events';
import { GAME_ERROR_EVENT, GAME_STATE_EVENT } from './nexus/events';

const COLS = 7;
const ROWS = 7;
const MAX_TURNS = 40;

interface AppState extends GameStateDetail {
  errorMessage: string | null;
}

const initialState: AppState = {
  currentPlayer: 'P1',
  turnCount: 0,
  maxTurns: MAX_TURNS,
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

function turnTitle(state: AppState): string {
  if (state.winner === 'draw') return 'Game Over — Draw';
  if (state.winner === 'P1') return 'Game Over — Player 1 wins';
  if (state.winner === 'P2') return 'Game Over — Player 2 wins';
  if (state.phases[state.currentPlayer] === 'Placement') {
    return state.currentPlayer === 'P1' ? 'Player 1 — Place your Source' : 'Player 2 — Place your Source';
  }
  return state.currentPlayer === 'P1' ? 'Player 1 turn' : 'Player 2 turn';
}

function turnClass(state: AppState): string {
  if (state.winner) return 'turn-banner over';
  return state.currentPlayer === 'P1' ? 'turn-banner p1' : 'turn-banner p2';
}

export function App() {
  const [state, setState] = createStore<AppState>({ ...initialState });
  let boardRef!: HTMLDivElement;
  let gameService: GameService | null = null;
  let errorTimer: number | null = null;

  async function startNewGame() {
    gameService?.destroy();
    const session = new GameSession({ cols: COLS, rows: ROWS, maxTurns: MAX_TURNS });
    gameService = new GameService(session);
    await gameService.mount(boardRef);
    setState({ ...initialState });
  }

  onMount(async () => {
    const session = new GameSession({ cols: COLS, rows: ROWS, maxTurns: MAX_TURNS });
    gameService = new GameService(session);
    await gameService.mount(boardRef);

    const onState = (e: CustomEvent<GameStateDetail>) => {
      setState({ ...e.detail, errorMessage: state.errorMessage });
    };

    const onError = (e: CustomEvent<string>) => {
      setState('errorMessage', e.detail);
      if (errorTimer !== null) window.clearTimeout(errorTimer);
      errorTimer = window.setTimeout(() => {
        setState('errorMessage', null);
        errorTimer = null;
      }, 2500);
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
      {/* ── Board column ── */}
      <div id="board">
        <div ref={boardRef} class="board-canvas-slot" />
        <div class={`board-message${state.errorMessage ? ' show' : ''}`}>
          {state.errorMessage ?? ''}
        </div>
      </div>

      {/* ── Panel column ── */}
      <div id="panel">
        {/* Controls */}
        <div class="controls">
          <section class={turnClass(state)}>
            <strong>{turnTitle(state)}</strong>
            <span>{state.phases[state.currentPlayer] === 'Placement'
              ? 'Click an empty cell to place your source'
              : `Turn ${state.turnCount} / ${state.maxTurns} · Playable nodes: ${state.actionableNodes}`}</span>
          </section>

          <section class="turn-controls">
            <button
              type="button"
              class="btn btn-light"
              disabled={!state.canUndo}
              onClick={() => gameService?.undoLastMove()}
            >
              Undo Last
            </button>
            <button
              type="button"
              class="btn btn-primary"
              disabled={!state.canReady}
              onClick={() => gameService?.finishTurn()}
            >
              Ready
            </button>
            {state.canSurrender && (
              <button
                type="button"
                class="btn btn-danger"
                onClick={() => gameService?.surrenderCurrentPlayer()}
              >
                Surrender
              </button>
            )}
            {state.isGameOver && (
              <button
                type="button"
                class="btn btn-new-game"
                onClick={() => startNewGame()}
              >
                New Game
              </button>
            )}
          </section>

          <section class="score-panel card">
            <h3>SCORE</h3>
            <div class="score-grid">
              <div class="score-row p1">
                <span class="dot" />
                <span>{`P1: ${state.scores.P1}`}</span>
                <span class="phase-badge">{state.phases.P1 === 'Expansion' ? 'EXP' : state.phases.P1 === 'Placement' ? 'PLC' : 'FND'}</span>
              </div>
              <div class="score-row p2">
                <span class="dot" />
                <span>{`P2: ${state.scores.P2}`}</span>
                <span class="phase-badge">{state.phases.P2 === 'Expansion' ? 'EXP' : state.phases.P2 === 'Placement' ? 'PLC' : 'FND'}</span>
              </div>
            </div>
          </section>

          <section class="card guide-panel">
            <h3>GAME GUIDE</h3>
            <ul>
              <li>Placement: click an empty cell to place your Source node.</li>
              <li>Source hubs can only create straight (orthogonal) vectors, length 1 or 2.</li>
              <li>Normal: orthogonally adjacent — always available.</li>
              <li>Diagonal: diagonally adjacent, both ends must be owned. Blocks crossing diagonals. Unlocks in Expansion (+1 bonus to origin).</li>
              <li>Bridge (straight): distance 2 orthogonal, traps opponent node in the middle. Unlocks in Expansion.</li>
              <li>Bridge (diagonal): distance 2 diagonal (checkers jump), traps opponent node in the middle. Unlocks in Expansion.</li>
              <li>No vector can cross another vector.</li>
              <li>Nodes under a length-2 Source vector are blocked and cannot be used.</li>
              <li>Expansion phase: ≥4 owned nodes in your circuit.</li>
              <li>Opening move is free; every subsequent move must touch your circuit.</li>
              <li>Balanced (in=out) hubs cannot output until a new input arrives.</li>
              <li>Relay (1-in/1-out) is transitional — 0 pts, can receive input.</li>
              <li>Trapped (X) hubs are permanently unplayable, score 0.</li>
              <li>Hub scores: SRC/END=1, FRK/JON=3, RCT=5. Balanced/Relay=0.</li>
              <li>Diagonal bonus adds +1 to the origin hub.</li>
              <li>Any owned hub that is not trapped or balanced can create outbound vectors (including END).</li>
              <li>If a player has no legal move, they automatically lose.</li>
              <li>You can surrender to concede the current match.</li>
              <li>Tiebreak: more owned nodes. Still tied → draw.</li>
            </ul>
          </section>
        </div>

        {/* Move log */}
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
    </div>
  );
}