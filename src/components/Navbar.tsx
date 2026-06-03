import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, LogOut, Library } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" />
          </span>
          HUST<span className="text-primary">Lib</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/">
            <Button variant="ghost" size="sm">Catalog</Button>
          </Link>
          {user ? (
            <>
              <Link to="/my-rentals">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Library className="h-4 w-4" /> My Rentals
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={signOut} className="gap-1.5">
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm">Sign in</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
