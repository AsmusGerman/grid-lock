import type { GameStateDetail } from '../../nexus/events';
import { ScorePanel } from '../ScorePanel';
import { TurnIndicator } from '../TurnIndicator';
interface Props { state: GameStateDetail; onSurrender: () => void; onUndo: () => void; onBridge: () => void }
export function InfoColumn(props: Props) {
  const noBridge = () => props.state.bridgeCharges[props.state.currentPlayer] <= 0 || props.state.isGameOver;
  return (
    <div id="info-col">
      <TurnIndicator state={props.state} />
      <ScorePanel state={props.state} />
      <div class="primary-actions">
        <button type="button" class="btn btn-outline icon-btn" disabled={!props.state.canUndo} onClick={props.onUndo}><span class="icon">↶</span><span class="label">Undo</span></button>
        <button type="button" class={`btn icon-btn ${props.state.bridgeMode ? 'btn-bridge-active' : 'btn-outline'}`} disabled={noBridge()} onClick={props.onBridge}><span class="icon">⌁</span><span class="label">Bridge</span></button>
        <button type="button" class="btn btn-surrender icon-btn" disabled={!props.state.canSurrender} onClick={props.onSurrender}><span class="icon">×</span><span class="label">Surrender</span></button>
      </div>
    </div>
  );
}
