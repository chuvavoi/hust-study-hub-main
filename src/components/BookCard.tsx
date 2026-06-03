import { Link } from "@tanstack/react-router";
import { BookOpen, MapPin, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatVND } from "@/lib/hust";

export interface BookRow {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  description: string | null;
  school: string;
  course_codes: string[];
  type: "online" | "offline" | "both";
  total_pages: number;
  price: number;
  physical_stock: number;
}

export function BookCard({ book }: { book: BookRow }) {
  return (
    <Link to="/book/$bookId" params={{ bookId: book.id }}>
      <Card className="group h-full overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-elegant">
        <div className="flex aspect-[3/2] items-center justify-center bg-hero-gradient">
          <BookOpen className="h-12 w-12 text-primary-foreground/80" />
        </div>
        <div className="space-y-2 p-4">
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary">{book.school}</Badge>
            {book.course_codes.slice(0, 2).map((c) => (
              <Badge key={c} variant="outline">{c}</Badge>
            ))}
          </div>
          <h3 className="line-clamp-2 font-display font-semibold leading-snug">{book.title}</h3>
          <p className="text-sm text-muted-foreground">{book.author}</p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold text-primary">{formatVND(book.price)}</span>
            <div className="flex gap-2 text-muted-foreground">
              {book.type !== "offline" && <Wifi className="h-4 w-4" />}
              {book.type !== "online" && <MapPin className="h-4 w-4" />}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
