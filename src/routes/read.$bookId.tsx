import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { EbookReader } from "@/components/EbookReader";
import type { BookRow } from "@/components/BookCard";

export const Route = createFileRoute("/read/$bookId")({
  component: ReadPage,
});

function ReadPage() {
  const { bookId } = useParams({ from: "/read/$bookId" });
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: book } = useQuery({
    queryKey: ["book", bookId],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("*").eq("id", bookId).single();
      if (error) throw error;
      return data as BookRow;
    },
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {user && book && <EbookReader bookId={bookId} price={book.price} />}
      </main>
    </div>
  );
}
