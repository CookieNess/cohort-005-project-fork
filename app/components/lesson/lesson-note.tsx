import { useState } from "react";
import { useFetcher } from "react-router";
import { NotebookPen } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import {
  noteLengthStatus,
  type NoteLengthStatus,
  type NoteLengthTone,
} from "~/modules/note-editor";
import { cn, formatRelativeTime } from "~/lib/utils";

const counterTone: Record<NoteLengthTone, string> = {
  normal: "text-muted-foreground",
  warning: "text-amber-600 dark:text-amber-500",
  over: "font-medium text-destructive",
};

export function LessonNote({
  note,
}: {
  note: { body: string; updatedAt: string } | null;
}) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const isSaving = fetcher.state !== "idle";
  const error = fetcher.data?.error;
  const [body, setBody] = useState(note?.body ?? "");
  const length = noteLengthStatus(body);

  return (
    <Card className="mb-8 gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <NotebookPen className="size-4 text-muted-foreground" />
          <h2>Your notes</h2>
        </CardTitle>
        <CardDescription>
          Private to you. Only you can read this.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <fetcher.Form method="post" className="space-y-3">
          <input type="hidden" name="intent" value="save-note" />
          <Textarea
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Jot down what you want to remember from this lesson…"
            aria-invalid={length.tone === "over" || Boolean(error)}
            className="max-h-96 min-h-36 resize-y leading-relaxed wrap-anywhere"
          />
          <NoteFooter
            error={error}
            updatedAt={note?.updatedAt}
            length={length}
            isSaving={isSaving}
          />
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}

function NoteFooter({
  error,
  updatedAt,
  length,
  isSaving,
}: {
  error: string | undefined;
  updatedAt: string | undefined;
  length: NoteLengthStatus;
  isSaving: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 text-xs">
        {error ? (
          <span className="text-sm text-destructive">{error}</span>
        ) : (
          updatedAt && (
            <span suppressHydrationWarning className="text-muted-foreground">
              Last edited {formatRelativeTime(updatedAt)}
            </span>
          )
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className={cn("text-xs tabular-nums", counterTone[length.tone])}>
          {length.label}
        </span>
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save note"}
        </Button>
      </div>
    </div>
  );
}
