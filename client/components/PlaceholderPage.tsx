import { Link } from "react-router-dom";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PlaceholderPage({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-card px-6 py-16 text-center shadow-soft">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">
        <Icon className="h-8 w-8" strokeWidth={1.8} />
      </span>
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {title}
        </h1>
        <p className="mx-auto max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <p className="max-w-xs text-sm text-muted-foreground">
        This screen is coming soon. Keep chatting with the app builder to fill
        in this page next.
      </p>
      <Button asChild variant="secondary" className="rounded-full px-5">
        <Link to="/">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </Button>
    </div>
  );
}
