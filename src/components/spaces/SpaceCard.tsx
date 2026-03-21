import { Link } from "@/i18n/routing";
import type { Space } from "@/lib/queries/spaces";

export function SpaceCard({ space, locale }: { space: Space; locale: string }) {
  const name = locale === "fr" ? space.name_fr : locale === "es" ? space.name_es : space.name_en;
  const desc = locale === "fr" ? space.description_fr : locale === "es" ? space.description_es : space.description_en;

  return (
    <Link
      href={`/spaces/${space.slug}`}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-card transition-all hover:shadow-card-hover dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${space.color} bg-opacity-10`}>
          {space.icon}
        </span>
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
            {name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {space.members_count} membres · {space.posts_count} posts
          </p>
        </div>
      </div>
      {desc && (
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{desc}</p>
      )}
    </Link>
  );
}
