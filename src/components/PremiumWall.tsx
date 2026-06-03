import { useState } from "react";
import { CreditCard, PlayCircle, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatVND } from "@/lib/hust";

interface Props {
  open: boolean;
  price: number;
  onPay: () => Promise<void>;
  onAdComplete: () => Promise<void>;
}

/**
 * Gatekeeping overlay shown when the reader hits a locked page.
 * Option A: pay to unlock. Option B: watch an ad for +5 pages.
 */
export function PremiumWall({ open, price, onPay, onAdComplete }: Props) {
  const [adPlaying, setAdPlaying] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [paying, setPaying] = useState(false);

  function playAd() {
    // MOCKED video ad. Replace with Google AdSense/AdMob or an ad-player SDK.
    // The real provider fires its own onAdComplete -> call handleAdComplete().
    setAdPlaying(true);
    setAdProgress(0);
    const started = Date.now();
    const duration = 5000;
    const timer = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - started) / duration) * 100);
      setAdProgress(pct);
      if (pct >= 100) {
        clearInterval(timer);
        handleAdComplete();
      }
    }, 100);
  }

  async function handleAdComplete() {
    await onAdComplete();
    setAdPlaying(false);
    setAdProgress(0);
  }

  async function handlePay() {
    setPaying(true);
    try {
      await onPay();
    } finally {
      setPaying(false);
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center font-display">
            You've reached the free preview limit
          </DialogTitle>
          <DialogDescription className="text-center">
            The first 10 pages are free. Choose how you'd like to keep reading.
          </DialogDescription>
        </DialogHeader>

        {adPlaying ? (
          <div className="rounded-lg border bg-muted/40 p-6 text-center">
            <PlayCircle className="mx-auto mb-3 h-10 w-10 animate-pulse text-accent" />
            <p className="text-sm font-medium">Playing ad…</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${adProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {Math.round(adProgress)}% — unlocking +5 pages
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Button onClick={handlePay} disabled={paying} className="h-auto w-full justify-start gap-3 py-3">
              {paying ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CreditCard className="h-5 w-5" />
              )}
              <span className="text-left">
                <span className="block font-semibold">Pay to Unlock</span>
                <span className="block text-xs opacity-90">
                  Full access for 14 days · {formatVND(price)}
                </span>
              </span>
            </Button>

            <Button
              onClick={playAd}
              variant="outline"
              className="h-auto w-full justify-start gap-3 py-3"
            >
              <PlayCircle className="h-5 w-5 text-accent" />
              <span className="text-left">
                <span className="block font-semibold">Watch an Ad to Continue</span>
                <span className="block text-xs text-muted-foreground">
                  Unlock the next 5 pages (30 min)
                </span>
              </span>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
