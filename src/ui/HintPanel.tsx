const guideItems = [
  'Stage 0 setup: P1 places Source in top-left zone and P2 in bottom-right zone.',
  'The middle diagonal is neutral and forbidden for source placement by both players.',
  'After setup, each turn allows one legal action followed by Ready.',
  'Normal links are orthogonal distance 1 and are always available.',
  'Diagonal links require both endpoints to already be owned and grant +1 bonus at origin.',
  'Bridge links use distance 2 and affect the middle node according to source type.',
  'Straight bridge can reverse an opposite direction between your own endpoints; the middle node is nullified to X.',
  'No connection may cross an existing connection.',
  'After your first move, every next move must connect to your existing circuit.',
  'Double-click your own straight dead-end leaf to convert it to X and retract that leaf path.',
  'Foundation advances to Expansion once you control at least 4 active nodes.',
  'Balanced, relay, and trapped nodes cannot emit vectors and score 0 while inactive.',
  'If a player has no legal move, they lose immediately.',
  'If total turns are reached, highest score wins, then owned-node tiebreak applies.',
];

interface HintPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HintPanel(props: HintPanelProps) {
  if (!props.isOpen) return null;

  return (
    <div class="modal-backdrop" role="presentation" onClick={props.onClose}>
      <section
        class="modal-card hint-modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="GridLock guide"
        onClick={event => event.stopPropagation()}
      >
        <div class="hint-modal-header">
          <h3>GRIDLOCK GUIDE</h3>
          <button type="button" class="btn btn-light hint-close-btn" onClick={props.onClose}>Close</button>
        </div>
        <div class="guide-scroll">
          <ul>
            {guideItems.map(item => <li>{item}</li>)}
          </ul>
        </div>
      </section>
    </div>
  );
}
