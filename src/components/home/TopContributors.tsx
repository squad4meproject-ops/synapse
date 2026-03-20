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
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-bold text-gray-900">Top Contributors</h3>
      <div className="mt-3 space-y-3">
        {contributors.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name || ""}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                {(user.display_name || user.username || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {user.display_name || user.username || "Anonymous"}
              </p>
              {user.username && (
                <p className="truncate text-xs text-gray-500">@{user.username}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
