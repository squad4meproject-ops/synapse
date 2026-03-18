import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ToolLoading() {
  return (
    <Container className="py-12">
      <Skeleton className="h-4 w-32" />
      <div className="mt-8 flex items-start gap-6">
        <Skeleton className="h-20 w-20 rounded-xl" />
        <div>
          <Skeleton className="h-8 w-48" />
          <div className="mt-2 flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="mt-8 space-y-3">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
      </div>
      <Skeleton className="mt-8 h-12 w-36 rounded-lg" />
    </Container>
  );
}
