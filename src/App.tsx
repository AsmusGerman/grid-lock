import { createSignal, onCleanup, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { GameSession } from './nexus/session/GameSession';
import { GAME_ERROR_EVENT, GAME_STATE_EVENT, type GameStateDetail } from './nexus/events';
import { GameService } from './services/GameService';
import { AppHeader } from './ui/app/AppHeader';
import { BoardSection } from './ui/app/BoardSection';
import { BottomBar } from './ui/app/BottomBar';
import { InfoColumn } from './ui/app/InfoColumn';
import { MoveLogModal } from './ui/app/MoveLogModal';
import { MoveLogPanel } from './ui/app/MoveLogPanel';
import { NewGameModal } from './ui/app/NewGameModal';
import { HintPanel } from './ui/HintPanel';
import { HintToast } from './ui/HintToast';

const initialState: GameStateDetail = {
  currentPlayer: 'P1', actionCount: 0, maxActions: 20, remainingActions: { P1: 10, P2: 10 }, bridgeCharges: { P1: 2, P2: 2 },
  breaches: { P1: 0, P2: 0 }, selectedSource: null, bridgeMode: false, moveLog: [], canUndo: false, canSurrender: true,
  winner: null, endReason: null, isGameOver: false,
};

export function App() {
  const [state, setState] = createStore<GameStateDetail>({ ...initialState });
  const [newGameOpen, setNewGameOpen] = createSignal(false); const [historyOpen, setHistoryOpen] = createSignal(false);
  const [tutorialOpen, setTutorialOpen] = createSignal(false); const [toast, setToast] = createSignal<string | null>(null);
  let boardRef!: HTMLDivElement; let guideButton!: HTMLButtonElement; let service: GameService | null = null; let toastTimer: number | undefined;
  const showToast = (message: string) => { setToast(message); if (toastTimer) clearTimeout(toastTimer); toastTimer = window.setTimeout(() => setToast(null), 2800); };
  const start = async () => { service?.destroy(); service = new GameService(new GameSession()); await service.mount(boardRef); setState({ ...initialState }); };
  onMount(() => {
    const stateHandler = (event: CustomEvent<GameStateDetail>) => setState(event.detail);
    const errorHandler = (event: CustomEvent<string>) => showToast(event.detail);
    window.addEventListener(GAME_STATE_EVENT, stateHandler); window.addEventListener(GAME_ERROR_EVENT, errorHandler); void start();
    onCleanup(() => { window.removeEventListener(GAME_STATE_EVENT, stateHandler); window.removeEventListener(GAME_ERROR_EVENT, errorHandler); service?.destroy(); if (toastTimer) clearTimeout(toastTimer); });
  });
  const confirmNewGame = async () => { await start(); setNewGameOpen(false); };
  return <div id="app">
    <AppHeader onNewGame={() => setNewGameOpen(true)} onOpenHistory={() => setHistoryOpen(true)} onOpenGuide={() => setTutorialOpen(true)} setGuideTriggerRef={el => { guideButton = el; }} />
    <div class="hint-toast-slot"><HintToast message={toast()} /></div>
    <div id="content">
      <BoardSection setBoardRef={el => { boardRef = el; }} />
      <InfoColumn state={state} onSurrender={() => service?.surrenderCurrentPlayer()} onUndo={() => service?.undoLastMove()} onBridge={() => service?.toggleBridgeMode()} />
      <MoveLogPanel moveLog={state.moveLog} />
    </div>
    <BottomBar state={state} onSurrender={() => service?.surrenderCurrentPlayer()} onUndo={() => service?.undoLastMove()} onBridge={() => service?.toggleBridgeMode()} />
    <HintPanel isOpen={tutorialOpen()} onClose={() => setTutorialOpen(false)} triggerEl={guideButton} />
    <MoveLogModal isOpen={historyOpen()} moveLog={state.moveLog} onClose={() => setHistoryOpen(false)} />
    <NewGameModal isOpen={newGameOpen()} onClose={() => setNewGameOpen(false)} onConfirm={() => void confirmNewGame()} />
  </div>;
}
