import { createStore } from 'solid-js/store';
import { createSignal } from 'solid-js';
import { onMount, onCleanup } from 'solid-js';
import { GameSession } from './nexus/session/GameSession';
import { GameService } from './services/GameService';
import type { GameStateDetail } from './nexus/events';
import { GAME_ERROR_EVENT, GAME_STATE_EVENT } from './nexus/events';
import { uiText } from './content/uiText';
import { HintPanel } from './ui/HintPanel';
import { HintToast } from './ui/HintToast';
import { AppHeader } from './ui/app/AppHeader';
import { BoardSection } from './ui/app/BoardSection';
import { BottomBar } from './ui/app/BottomBar';
import { InfoColumn } from './ui/app/InfoColumn';
import { MoveLogModal } from './ui/app/MoveLogModal';
import { MoveLogPanel } from './ui/app/MoveLogPanel';
import { NewGameModal } from './ui/app/NewGameModal';
import type { BoardSize } from './ui/app/types';

const DEFAULT_BOARD_SIZE: BoardSize = 7;
const MAX_TURNS_BY_SIZE: Record<BoardSize, number> = {
  5: 24,
  7: 40,
  9: 60,
};
const TOAST_MS = 4200;

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

function boardMessageFromDetail(detail: GameStateDetail): string {
  if (detail.phases[detail.currentPlayer] === 'Placement') {
    return uiText.boardMessages.placement;
  }
  return uiText.boardMessages.default;
}

export function App() {
  const [state, setState] = createStore<AppState>({ ...initialState });
  const [nextBoardSize, setNextBoardSize] = createSignal<BoardSize>(DEFAULT_BOARD_SIZE);
  const [showNewGameModal, setShowNewGameModal] = createSignal(false);
  const [showHistoryModal, setShowHistoryModal] = createSignal(false);
  const [showHintModal, setShowHintModal] = createSignal(false);
  const [hintToastMessage, setHintToastMessage] = createSignal<string | null>(null);
  let boardRef!: HTMLDivElement;
  let hintTriggerRef!: HTMLButtonElement;
  let gameService: GameService | null = null;
  let toastTimer: number | undefined;

  function showHintToast(message: string): void {
    setHintToastMessage(message);
    if (toastTimer !== undefined) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      setHintToastMessage(null);
      toastTimer = undefined;
    }, TOAST_MS);
  }

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

  function openHistoryModal(): void {
    setShowHistoryModal(true);
  }

  function closeHistoryModal(): void {
    setShowHistoryModal(false);
  }

  function closeHintModal(): void {
    setShowHintModal(false);
  }

  async function confirmNewGame(): Promise<void> {
    await startNewGame(nextBoardSize());
    setShowNewGameModal(false);
  }

  onMount(() => {
    const onState = (e: CustomEvent<GameStateDetail>) => {
      setState({ ...e.detail, errorMessage: null });
      showHintToast(boardMessageFromDetail(e.detail));
    };

    const onError = (e: CustomEvent<string>) => {
      setState('errorMessage', e.detail);
      showHintToast(e.detail);
    };

    window.addEventListener(GAME_STATE_EVENT, onState);
    window.addEventListener(GAME_ERROR_EVENT, onError);

    const initialSize = nextBoardSize();
    const session = new GameSession({
      cols: initialSize,
      rows: initialSize,
      maxTurns: MAX_TURNS_BY_SIZE[initialSize],
    });
    gameService = new GameService(session);
    void gameService.mount(boardRef);
    showHintToast(uiText.boardMessages.placement);

    onCleanup(() => {
      window.removeEventListener(GAME_STATE_EVENT, onState);
      window.removeEventListener(GAME_ERROR_EVENT, onError);
      gameService?.destroy();
      if (toastTimer !== undefined) {
        window.clearTimeout(toastTimer);
        toastTimer = undefined;
      }
    });
  });

  return (
    <div id="app">
      <AppHeader
        onNewGame={openNewGameModal}
        onOpenHistory={openHistoryModal}
        onOpenGuide={openHintModal}
        setGuideTriggerRef={(el) => {
          hintTriggerRef = el;
        }}
      />

      <div class="hint-toast-slot">
        <HintToast message={hintToastMessage()} />
      </div>

      <div id="content">

        <BoardSection
          setBoardRef={(el) => {
            boardRef = el;
          }}
        />

        <InfoColumn
          state={state}
          onSurrender={() => gameService?.surrenderCurrentPlayer()}
          onUndo={() => gameService?.undoLastMove()}
          onConfirm={() => gameService?.finishTurn()}
        />

        <MoveLogPanel moveLog={state.moveLog} />
      </div>

      <BottomBar
        currentPlayer={state.currentPlayer}
        canSurrender={state.canSurrender}
        canUndo={state.canUndo}
        canReady={state.canReady}
        onSurrender={() => gameService?.surrenderCurrentPlayer()}
        onUndo={() => gameService?.undoLastMove()}
        onConfirm={() => gameService?.finishTurn()}
      />

      <HintPanel isOpen={showHintModal()} onClose={closeHintModal} triggerEl={hintTriggerRef} />

      <MoveLogModal
        isOpen={showHistoryModal()}
        moveLog={state.moveLog}
        onClose={closeHistoryModal}
      />

      <NewGameModal
        isOpen={showNewGameModal()}
        boardSize={nextBoardSize()}
        maxTurns={MAX_TURNS_BY_SIZE[nextBoardSize()]}
        onClose={cancelNewGame}
        onConfirm={() => void confirmNewGame()}
        onBoardSizeChange={setNextBoardSize}
      />
    </div>
  );
}
