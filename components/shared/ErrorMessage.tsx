export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">
      {message}
    </div>
  );
}
