export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-night-700 p-8 text-center">
      <p className="font-display text-lg text-moonlight-100">{title}</p>
      {description && <p className="mt-1 text-sm text-moonlight-300">{description}</p>}
    </div>
  );
}
