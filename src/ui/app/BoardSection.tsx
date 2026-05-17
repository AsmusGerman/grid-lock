interface BoardSectionProps {
  setBoardRef: (el: HTMLDivElement) => void;
}

export function BoardSection(props: BoardSectionProps) {
  return <div id="board" class="box" ref={props.setBoardRef} />;
}
