interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md";
}

export function LevelBadge({ level, size = "sm" }: LevelBadgeProps) {
  const sizeClasses = size === "sm"
    ? "h-5 w-5 text-[10px]"
    : "h-6 w-6 text-xs";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 font-bold text-white ${sizeClasses}`}
      title={`Level ${level}`}
    >
      {level}
    </span>
  );
}
