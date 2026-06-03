import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, MapPin, Wifi, QrCode, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BookRow } from "@/components/BookCard";
import { bookOffline } from "@/lib/reading.functions";
import { PICKUP_LOCATIONS, formatVND, schoolLabel } from "@/lib/hust";

export const Route = createFileRoute("/book/$bookId")({
  component: BookDetail,
});

function BookDetail() {
  const { bookId } = useParams({ from: "/book/$bookId" });
  const navigate = useNavigate();
  const { user } = useAuth();
  const reserve = useServerFn(bookOffline);

  const [pickup, setPickup] = useState(PICKUP_LOCATIONS[0]);
  const [booking, setBooking] = useState(false);
  const [qr, setQr] = useState<{ code: string; location: string } | null>(null);

  const { data: book, isLoading } = useQuery({
    queryKey: ["book", bookId],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("*").eq("id", bookId).single();
      if (error) throw error;
      return data as BookRow;
    },
  });

  function requireLogin(): boolean {
    if (!user) {
      toast.info("Please sign in with your HUST email first.");
      navigate({ to: "/auth" });
      return false;
    }
    return true;
  }

  async function reserveOffline() {
    if (!requireLogin()) return;
    setBooking(true);
    try {
      const r = await reserve({ data: { bookId, pickupLocation: pickup } });
      setQr({ code: r.qr_code as string, location: r.pickup_location as string });
      toast.success("Reserved! Show the QR code at the counter within 24h.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setBooking(false);
    }
  }

  if (isLoading || !book) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const canOnline = book.type !== "offline";
  const canOffline = book.type !== "online";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-[280px_1fr]">
          <div>
            <div className="flex aspect-[3/4] items-center justify-center rounded-2xl bg-hero-gradient shadow-elegant">
              <BookOpen className="h-16 w-16 text-primary-foreground/80" />
            </div>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap gap-1">
              <Badge variant="secondary">{schoolLabel(book.school)}</Badge>
              {book.course_codes.map((c) => (
                <Badge key={c} variant="outline">{c}</Badge>
              ))}
            </div>
            <h1 className="font-display text-3xl font-bold">{book.title}</h1>
            <p className="mt-1 text-muted-foreground">by {book.author}</p>
            <p className="mt-4 text-card-foreground/90">{book.description}</p>
            <p className="mt-3 text-2xl font-bold text-primary">{formatVND(book.price)}</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {canOnline && (
                <Card className="p-5">
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    <Wifi className="h-4 w-4 text-primary" /> Online E-book
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Read the first 10 pages free. {book.total_pages} pages total.
                  </p>
                  <Button
                    className="w-full"
                    onClick={() =>
                      requireLogin() && navigate({ to: "/read/$bookId", params: { bookId } })
                    }
                  >
                    Start reading
                  </Button>
                </Card>
              )}

              {canOffline && (
                <Card className="p-5">
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    <MapPin className="h-4 w-4 text-accent" /> Physical Pickup
                  </div>
                  {qr ? (
                    <div className="text-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qr.code)}`}
                        alt="Pickup QR code"
                        className="mx-auto rounded-lg border"
                        width={160}
                        height={160}
                      />
                      <p className="mt-2 flex items-center justify-center gap-1 text-sm font-medium text-primary">
                        <CheckCircle2 className="h-4 w-4" /> {qr.code}
                      </p>
                      <p className="text-xs text-muted-foreground">{qr.location} · within 24h</p>
                    </div>
                  ) : (
                    <>
                      <p className="mb-3 text-sm text-muted-foreground">
                        {book.physical_stock > 0
                          ? `${book.physical_stock} copies available.`
                          : "Out of stock."}
                      </p>
                      <Select value={pickup} onValueChange={setPickup}>
                        <SelectTrigger className="mb-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PICKUP_LOCATIONS.map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="secondary"
                        className="w-full gap-2"
                        disabled={booking || book.physical_stock <= 0}
                        onClick={reserveOffline}
                      >
                        {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                        Reserve & get QR
                      </Button>
                    </>
                  )}
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
