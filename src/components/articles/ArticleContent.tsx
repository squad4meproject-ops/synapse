export function ArticleContent({ content }: { content: string }) {
  return (
    <article
      className="prose prose-lg mx-auto max-w-3xl prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-primary-600 prose-strong:text-gray-900"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
