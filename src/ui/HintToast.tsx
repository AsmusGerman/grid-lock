interface HintToastProps {
  message: string | null;
}

export function HintToast(props: HintToastProps) {
  return (
    <div
      class={`hint-toast ${props.message ? 'is-visible' : ''}`}
      role="status"
      aria-live="polite"
      aria-hidden={!props.message}
    >
      {props.message ? props.message : null}
    </div>
  );
}
