import type { GameStateDetail } from '../../nexus/events';
interface Props { state: GameStateDetail; onSurrender: () => void; onUndo: () => void; onBridge: () => void }
export function BottomBar(props: Props) {
  return (
    <div class="bottom-bar">
      <button type="button" class="btn btn-surrender icon-btn bottom-btn" disabled={!props.state.canSurrender} onClick={props.onSurrender}><span class="icon">×</span><span class="label">SURRENDER</span></button>
      <button type="button" class="btn btn-outline icon-btn bottom-btn" disabled={!props.state.canUndo} onClick={props.onUndo}><span class="icon">↶</span><span class="label">UNDO</span></button>
      <button type="button" class={`btn icon-btn bottom-btn ${props.state.bridgeMode ? 'btn-bridge-active' : 'btn-outline'}`} disabled={props.state.isGameOver || props.state.bridgeCharges[props.state.currentPlayer] <= 0} onClick={props.onBridge}><span class="icon">⌁</span><span class="label">BRIDGE {props.state.bridgeCharges[props.state.currentPlayer]}</span></button>
    </div>
  );
}
