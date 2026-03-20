import { setRequestLocale } from "next-intl/server";
import { generatePageMetadata } from "@/lib/seo";
import { NotificationsPageClient } from "./NotificationsPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return generatePageMetadata({
    title: "Notifications — Synapse",
    description: "Your notifications on Synapse",
    locale,
    path: "/notifications",
  });
}

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <NotificationsPageClient />;
}
