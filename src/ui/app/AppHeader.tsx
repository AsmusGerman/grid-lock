import { uiText } from '../../content/uiText';

interface AppHeaderProps {
  onNewGame: () => void;
  onOpenHistory: () => void;
  onOpenGuide: () => void;
  setGuideTriggerRef: (el: HTMLButtonElement) => void;
}

export function AppHeader(props: AppHeaderProps) {
  return (
    <nav class="title-bar">
      <div class="title-leading">
        <button
          type="button"
          class="btn btn-icon title-btn"
          aria-label={uiText.app.aria.newGame}
          onClick={props.onNewGame}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
      <h1 class="title-heading">{uiText.app.title}</h1>
      <div class="title-actions">
        <button
          type="button"
          class="btn btn-icon title-btn history-btn"
          aria-label={uiText.app.aria.openHistory}
          onClick={props.onOpenHistory}
        >
          <span aria-hidden="true">⟲</span>
        </button>
        <button
          ref={props.setGuideTriggerRef}
          type="button"
          class="btn btn-icon title-btn"
          aria-label={uiText.app.aria.openGuide}
          onClick={props.onOpenGuide}
        >
          <span aria-hidden="true">i</span>
        </button>
      </div>
    </nav>
  );
}
