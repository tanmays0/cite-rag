"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocTable, type DocRow } from "@/components/library/doc-table";
import { UploadZone } from "@/components/library/upload-zone";

export default function LibraryPage() {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (query = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/documents?limit=100&q=${encodeURIComponent(query)}`,
      );
      if (!res.ok) {
        setError("Couldn’t load documents.");
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { documents: DocRow[]; total: number };
      setDocs(data.documents);
      setTotal(data.total);
    } catch {
      setError("Network error loading library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    void load(q);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="brand-mark text-4xl text-paper">Library</h1>
          <p className="mt-2 text-sm text-mist">
            {total.toLocaleString()} documents in the index.
          </p>
        </div>
        <form onSubmit={onSearch} className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by title"
            className="w-52"
            aria-label="Filter by title"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      <UploadZone onUploaded={() => load(q)} />
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <DocTable docs={docs} loading={loading} />
    </div>
  );
}
