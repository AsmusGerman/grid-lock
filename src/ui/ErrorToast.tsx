interface ErrorToastProps {
  message: string;
}

/**
 * Persistent message strip for board hints and validation feedback.
 */
export function ErrorToast(props: ErrorToastProps) {
  return <div class="board-message">{props.message}</div>;
}