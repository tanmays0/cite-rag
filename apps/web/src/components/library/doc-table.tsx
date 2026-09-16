"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type DocRow = {
  id: string;
  title: string;
  sourceType: string;
  mime: string;
  status: string;
  byteSize: number;
  createdAt: string;
};

export function DocTable({
  docs,
  loading,
}: {
  docs: DocRow[];
  loading: boolean;
}) {
  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[0.03] font-mono text-[11px] uppercase tracking-wider text-mist">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Size</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-mist">
                Loading library…
              </td>
            </tr>
          ) : docs.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-mist">
                Nothing here yet. Upload a file or seed the corpus.
              </td>
            </tr>
          ) : (
            docs.map((d) => (
              <tr
                key={d.id}
                className="border-t border-white/10 hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/library/${d.id}`}
                    className="cursor-pointer text-paper hover:text-marker"
                  >
                    {d.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-mist">{d.sourceType}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "font-mono text-xs",
                      d.status === "ready" ? "text-teal-mute" : "text-mist",
                    )}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-mist">
                  {d.byteSize.toLocaleString()} B
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
