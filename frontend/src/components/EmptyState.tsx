interface Props {
  message: string;
}

export function EmptyState({ message }: Props) {
  return <p className="text-slate-500 italic">{message}</p>;
}
