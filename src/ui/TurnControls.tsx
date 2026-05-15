interface TurnControlsProps {
  canUndo: boolean;
  canReady: boolean;
  canSurrender: boolean;
  onUndo: () => void;
  onReady: () => void;
  onSurrender: () => void;
  onNewGame: () => void;
}

export function TurnControls(props: TurnControlsProps) {
  return (
    <section class="turn-controls">
      <button
        type="button"
        class="btn btn-light icon-btn"
        aria-label="Undo Last"
        disabled={!props.canUndo}
        onClick={props.onUndo}
      >
        <span class="icon" aria-hidden="true">↶</span>
        <span class="label">Undo</span>
      </button>

      <button
        type="button"
        class="btn btn-primary icon-btn"
        aria-label="Ready"
        disabled={!props.canReady}
        onClick={props.onReady}
      >
        <span class="icon" aria-hidden="true">✓</span>
        <span class="label">Ready</span>
      </button>

      <button
        type="button"
        class="btn btn-danger icon-btn"
        aria-label="Surrender"
        disabled={!props.canSurrender}
        onClick={props.onSurrender}
      >
        <span class="icon" aria-hidden="true">☠</span>
        <span class="label">Surrender</span>
      </button>

      <button
        type="button"
        class="btn btn-new-game icon-btn"
        aria-label="New Game"
        onClick={props.onNewGame}
      >
        <span class="icon" aria-hidden="true">⊕</span>
        <span class="label">New Game</span>
      </button>
    </section>
  );
}