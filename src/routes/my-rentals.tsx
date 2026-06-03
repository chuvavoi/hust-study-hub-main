import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { BookOpen, Wifi, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/my-rentals")({
  head: () => ({ meta: [{ title: "My Rentals — HUSTLib" }] }),
  component: MyRentals,
});

interface RentalRow {
  id: string;
  type: "online" | "offline";
  status: string;
  start_date: string;
  end_date: string | null;
  qr_code: string | null;
  pickup_location: string | null;
  books: { id: string; title: string; author: string } | null;
}

function MyRentals() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: rentals = [] } = useQuery({
    queryKey: ["rentals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rentals")
        .select("id, type, status, start_date, end_date, qr_code, pickup_location, books(id, title, author)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as RentalRow[];
    },
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-6 font-display text-3xl font-bold">My Rentals</h1>
        {rentals.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-40" />
            You have no rentals yet.{" "}
            <Link to="/" className="text-primary underline">Browse the catalog</Link>.
          </Card>
        ) : (
          <div className="space-y-3">
            {rentals.map((r) => (
              <Card key={r.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    {r.type === "online" ? (
                      <Wifi className="h-4 w-4 text-primary" />
                    ) : (
                      <MapPin className="h-4 w-4 text-accent" />
                    )}
                    <span className="font-display font-semibold">{r.books?.title ?? "Book"}</span>
                    <Badge variant="outline">{r.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {r.type === "online"
                      ? `Active until ${r.end_date ? format(new Date(r.end_date), "PP") : "—"}`
                      : `Pickup at ${r.pickup_location} · code ${r.qr_code}`}
                  </p>
                </div>
                {r.type === "online" && r.books && (
                  <Link to="/read/$bookId" params={{ bookId: r.books.id }}>
                    <Button size="sm">Read</Button>
                  </Link>
                )}
                {r.type === "offline" && r.qr_code && (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(r.qr_code)}`}
                    alt="Pickup QR"
                    width={80}
                    height={80}
                    className="rounded border"
                  />
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
