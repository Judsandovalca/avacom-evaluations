import { Button } from './Button';

interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorAlert({ message, onRetry }: Props) {
  return (
    <div role="alert" className="rounded-md bg-red-50 border border-red-200 p-4">
      <p className="text-red-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-2">
          Retry
        </Button>
      )}
    </div>
  );
}
