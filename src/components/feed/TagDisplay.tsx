import { Link } from "@/i18n/routing";
import type { Tag } from "@/types/database";

export function TagDisplay({ tags }: { tags?: Tag[] }) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`/feed?tag=${tag.slug}`}
          className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
        >
          #{tag.name}
        </Link>
      ))}
    </div>
  );
}
