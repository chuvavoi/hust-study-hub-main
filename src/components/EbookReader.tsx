import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PremiumWall } from "@/components/PremiumWall";
import {
  getBookContent,
  grantAdReward,
  rentOnline,
  type BookContentResult,
} from "@/lib/reading.functions";

export function EbookReader({ bookId, price }: { bookId: string; price: number }) {
  const navigate = useNavigate();
  const fetchContent = useServerFn(getBookContent);
  const watchAd = useServerFn(grantAdReward);
  const pay = useServerFn(rentOnline);

  const [data, setData] = useState<BookContentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [wallOpen, setWallOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchContent({ data: { bookId } });
      setData(res);
    } catch {
      toast.error("Could not load this book.");
    } finally {
      setLoading(false);
    }
  }, [bookId, fetchContent]);

  useEffect(() => {
    load();
  }, [load]);

  // Content protection: block right-click, copy and selection on the reader.
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "p", "s", "u"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        toast("Copying and printing are disabled to protect copyright.");
      }
    };
    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);
    document.addEventListener("keydown", blockKeys);
    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("keydown", blockKeys);
    };
  }, []);

  function goNext() {
    if (!data) return;
    const next = page + 1;
    if (next > data.totalPages) return;
    if (next > data.accessiblePages) {
      setWallOpen(true);
      return;
    }
    setPage(next);
  }

  async function onAdComplete() {
    try {
      await watchAd({ data: { bookId } });
      const res = await fetchContent({ data: { bookId } });
      setData(res);
      setWallOpen(false);
      setPage((p) => Math.min(p + 1, res.accessiblePages));
      toast.success("Unlocked 5 more pages. Enjoy!");
    } catch {
      toast.error("Could not verify the ad. Try again.");
    }
  }

  async function onPay() {
    try {
      await pay({ data: { bookId } });
      const res = await fetchContent({ data: { bookId } });
      setData(res);
      setWallOpen(false);
      setPage((p) => p + 1);
      toast.success("Payment complete — full access granted for 14 days.");
    } catch {
      toast.error("Payment failed. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!data) return null;

  const current = data.pages.find((p) => p.page_number === page);
  const previewBadge = data.reason !== "rental";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/book/$bookId", params: { bookId } })}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          {data.hasFullAccess
            ? "Full access"
            : `Preview · ${data.accessiblePages}/${data.totalPages} pages unlocked`}
        </div>
      </div>

      <article
        className="reader-protected min-h-[60vh] rounded-2xl border bg-card p-8 shadow-card md:p-12"
        onContextMenu={(e) => e.preventDefault()}
      >
        <h2 className="mb-1 font-display text-xl font-bold">{data.title}</h2>
        <p className="mb-6 text-xs uppercase tracking-wider text-muted-foreground">
          Page {page} of {data.totalPages}
        </p>
        <div className="whitespace-pre-line leading-relaxed text-card-foreground/90">
          {current?.content ?? "—"}
        </div>

        {previewBadge && page === data.accessiblePages && (
          <div className="mt-8 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 text-center text-sm text-muted-foreground">
            This is the last unlocked page. Tap “Next” to unlock more.
          </div>
        )}
      </article>

      <div className="mt-4 flex items-center justify-between">
        <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          {page} / {data.totalPages}
        </span>
        <Button onClick={goNext} disabled={page >= data.totalPages}>
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <PremiumWall open={wallOpen} price={price} onPay={onPay} onAdComplete={onAdComplete} />
    </div>
  );
}
