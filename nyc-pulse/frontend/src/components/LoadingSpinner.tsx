export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="flex gap-2">
        <div className="loading-dot w-2 h-2 bg-[#e63946] rounded-full" />
        <div className="loading-dot w-2 h-2 bg-[#e63946] rounded-full" />
        <div className="loading-dot w-2 h-2 bg-[#e63946] rounded-full" />
      </div>
      <p className="text-xs text-gray-500">{message}</p>
    </div>
  );
}

export function EmptyState({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
      <span className="text-5xl">{emoji}</span>
      <h3 className="text-base font-bold text-gray-200">{title}</h3>
      <p className="text-sm text-gray-500">{body}</p>
    </div>
  );
}
