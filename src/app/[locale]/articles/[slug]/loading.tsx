import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ArticleLoading() {
  return (
    <Container className="py-12">
      <Skeleton className="h-4 w-32" />
      <div className="mt-8">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="mt-4 h-6 w-full" />
        <Skeleton className="mt-2 h-4 w-48" />
        <Skeleton className="mt-10 aspect-video w-full rounded-xl" />
        <div className="mt-10 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    </Container>
  );
}
