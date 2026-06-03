import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { BookCard, type BookRow } from "@/components/BookCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SCHOOLS } from "@/lib/hust";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HUSTLib — Book & Document Rental for HUST Students" },
      {
        name: "description",
        content:
          "Rent e-books online or reserve physical books for campus pickup. Browse by HUST School and course code (IT3100, MI1111, and more).",
      },
      { property: "og:title", content: "HUSTLib — Book & Document Rental for HUST Students" },
      { property: "og:description", content: "Online e-book reading and offline book booking for HUST students." },
    ],
  }),
  component: Catalog,
});

function Catalog() {
  const [q, setQ] = useState("");
  const [school, setSchool] = useState<string>("all");

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BookRow[];
    },
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return books.filter((b) => {
      const matchSchool = school === "all" || b.school === school;
      const matchTerm =
        !term ||
        b.title.toLowerCase().includes(term) ||
        b.author.toLowerCase().includes(term) ||
        b.course_codes.some((c) => c.toLowerCase().includes(term));
      return matchSchool && matchTerm;
    });
  }, [books, q, school]);

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-6xl px-4 py-16 text-primary-foreground">
          <h1 className="max-w-2xl font-display text-4xl font-extrabold leading-tight md:text-5xl">
            The library, reimagined for HUST students.
          </h1>
          <p className="mt-3 max-w-xl text-primary-foreground/85">
            Read the first 10 pages of any e-book free. Unlock more by renting or
            watching an ad — or reserve a physical copy for campus pickup.
          </p>
          <div className="mt-6 flex max-w-lg items-center gap-2 rounded-xl bg-background p-2 shadow-elegant">
            <Search className="ml-2 h-5 w-5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, author or course code (e.g. IT3100)"
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={school === "all" ? "default" : "outline"}
            onClick={() => setSchool("all")}
          >
            All Schools
          </Button>
          {SCHOOLS.filter((s) => s.code !== "Other").map((s) => (
            <Button
              key={s.code}
              size="sm"
              variant={school === s.code ? "default" : "outline"}
              onClick={() => setSchool(s.code)}
            >
              {s.code}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading catalog…</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">No books match your search.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
