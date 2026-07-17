export function LoadingState({ label = 'Betöltés…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-moonlight-300">
      <span className="h-2 w-2 animate-pulse rounded-full bg-dusk-500" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-dusk-500 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-dusk-500 [animation-delay:300ms]" />
      <span className="ml-2 text-sm">{label}</span>
    </div>
  );
}
