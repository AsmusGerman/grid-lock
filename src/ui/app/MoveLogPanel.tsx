import type { MoveLogEntry } from '../../nexus/types';
import { uiText } from '../../content/uiText';

interface MoveLogPanelProps {
  moveLog: MoveLogEntry[];
}

export function MoveLogPanel(props: MoveLogPanelProps) {
  return (
    <div id="log-col">
      <section class="card box drawer log-panel">
        <h3>{uiText.moveLog.title}</h3>
        <ul class="log-list">
          {[...props.moveLog].reverse().map(entry => (
            <li class={`log-entry ${entry.player.toLowerCase()}`}>
              <span class="log-dot" />
              <span class="log-text">{entry.label}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
