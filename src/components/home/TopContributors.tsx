import { createClient } from "@/lib/supabase/server";

async function getTopContributors() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, display_name, username, avatar_url")
      .order("created_at", { ascending: true })
      .limit(5);

    if (error) throw error;
    return (data || []) as { id: string; display_name: string | null; username: string | null; avatar_url: string | null }[];
  } catch {
    return [];
  }
}

export async function TopContributors() {
  const contributors = await getTopContributors();

  if (!contributors.length) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover dark:border-gray-700 dark:bg-gray-900">
      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-yellow-100 text-xs">👑</span>
        Top Contributors
      </h3>
      <div className="mt-4 space-y-2">
        {contributors.map((user) => (
          <div key={user.id} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name || ""}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-primary-100"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-xs font-bold text-white ring-2 ring-primary-100">
                {(user.display_name || user.username || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {user.display_name || user.username || "Anonymous"}
              </p>
              {user.username && (
                <p className="truncate text-xs text-gray-400">@{user.username}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
