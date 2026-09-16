"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function UploadZone({
  onUploaded,
}: {
  onUploaded: () => Promise<void> | void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setUploading(true);
    setProgress(18);
    setError(null);
    setMessage(null);

    const tick = window.setInterval(() => {
      setProgress((p) => (p < 88 ? p + 7 : p));
    }, 280);

    try {
      const res = await fetch("/api/ingest", { method: "POST", body: fd });
      const data = (await res.json()) as { error?: string; documentId?: string };
      window.clearInterval(tick);
      if (!res.ok) {
        setProgress(0);
        setError(data.error || "Upload failed");
      } else {
        setProgress(100);
        setMessage("Document ingested and indexed.");
        form.reset();
        await onUploaded();
      }
    } catch {
      window.clearInterval(tick);
      setProgress(0);
      setError("Upload network error");
    } finally {
      setUploading(false);
      window.setTimeout(() => setProgress(0), 800);
    }
  }

  return (
    <div className="mt-8">
      <form
        onSubmit={onUpload}
        className="flex flex-wrap items-center gap-3 border-b border-white/10 pb-5"
      >
        <input
          type="file"
          name="file"
          accept=".txt,.pdf,text/plain,application/pdf"
          required
          className="cursor-pointer text-sm text-mist file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-marker file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-marker-ink"
        />
        <Button type="submit" disabled={uploading}>
          {uploading ? "Ingesting…" : "Upload PDF / TXT"}
        </Button>
        <span className="text-xs text-mist">TXT or PDF, up to 2MB.</span>
      </form>
      {uploading || progress > 0 ? (
        <div className="mt-3">
          <Progress value={progress} />
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-teal-mute">{message}</p> : null}
    </div>
  );
}
