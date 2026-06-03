import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const FREE_PREVIEW_PAGES = 10;
const AD_BONUS_PAGES = 5;
const AD_DURATION_MINUTES = 30;
const RENTAL_DAYS = 14;

export interface BookContentResult {
  bookId: string;
  title: string;
  totalPages: number;
  accessiblePages: number; // how many pages the user is allowed to read
  pages: { page_number: number; content: string }[]; // ONLY accessible pages are returned
  hasFullAccess: boolean;
  reason: "rental" | "ad" | "preview";
}

/**
 * SECURE PAGE SLICING.
 * The full book is NEVER sent to the client. We compute the user's entitlement
 * server-side (active rental OR a valid ad-watch token) and return only the
 * pages they are allowed to read. Everyone gets the first 10 pages (preview).
 */
export const getBookContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { bookId: string }) =>
    z.object({ bookId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }): Promise<BookContentResult> => {
    const userId = context.userId;
    const { bookId } = data;

    const { data: book, error: bookErr } = await supabaseAdmin
      .from("books")
      .select("id, title, total_pages")
      .eq("id", bookId)
      .single();
    if (bookErr || !book) throw new Error("Book not found");

    const nowIso = new Date().toISOString();

    // 1) Active online rental => full access
    const { data: rental } = await supabaseAdmin
      .from("rentals")
      .select("id")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .eq("type", "online")
      .eq("status", "active")
      .or(`end_date.is.null,end_date.gt.${nowIso}`)
      .limit(1)
      .maybeSingle();

    let accessiblePages = FREE_PREVIEW_PAGES;
    let reason: BookContentResult["reason"] = "preview";
    let hasFullAccess = false;

    if (rental) {
      accessiblePages = book.total_pages;
      reason = "rental";
      hasFullAccess = true;
    } else {
      // 2) Valid ad-watch sessions => preview + bonus pages (stacks)
      const { data: adSessions } = await supabaseAdmin
        .from("ad_watch_sessions")
        .select("pages_granted")
        .eq("user_id", userId)
        .eq("book_id", bookId)
        .gt("granted_until", nowIso);

      const bonus = (adSessions ?? []).reduce(
        (sum, s) => sum + (s.pages_granted ?? 0),
        0,
      );
      if (bonus > 0) reason = "ad";
      accessiblePages = Math.min(
        book.total_pages,
        FREE_PREVIEW_PAGES + bonus,
      );
    }

    accessiblePages = Math.min(accessiblePages, book.total_pages);

    // Slice: only fetch the pages the user is entitled to.
    const { data: pages } = await supabaseAdmin
      .from("book_pages")
      .select("page_number, content")
      .eq("book_id", bookId)
      .lte("page_number", accessiblePages)
      .order("page_number", { ascending: true });

    return {
      bookId,
      title: book.title,
      totalPages: book.total_pages,
      accessiblePages,
      pages: pages ?? [],
      hasFullAccess,
      reason,
    };
  });

/**
 * AD-WALL: called after a video ad is completed (onAdComplete).
 * Issues a temporary token granting +5 pages for 30 minutes.
 */
export const grantAdReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { bookId: string }) =>
    z.object({ bookId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const grantedUntil = new Date(
      Date.now() + AD_DURATION_MINUTES * 60_000,
    ).toISOString();
    const token = crypto.randomUUID();

    const { error } = await supabaseAdmin.from("ad_watch_sessions").insert({
      user_id: context.userId,
      book_id: data.bookId,
      token,
      pages_granted: AD_BONUS_PAGES,
      granted_until: grantedUntil,
    });
    if (error) throw new Error("Could not grant ad reward");

    return { token, pagesGranted: AD_BONUS_PAGES, grantedUntil };
  });

/**
 * PREMIUM PAYMENT (mocked wallet checkout): creates an active online rental
 * with start_date/end_date. Swap the mock for a real gateway webhook later.
 */
export const rentOnline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { bookId: string }) =>
    z.object({ bookId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const start = new Date();
    const end = new Date(start.getTime() + RENTAL_DAYS * 86_400_000);

    // prevent duplicate active rentals
    const { data: existing } = await supabaseAdmin
      .from("rentals")
      .select("id")
      .eq("user_id", context.userId)
      .eq("book_id", data.bookId)
      .eq("type", "online")
      .eq("status", "active")
      .maybeSingle();
    if (existing) return { id: existing.id, alreadyActive: true };

    const { data: rental, error } = await supabaseAdmin
      .from("rentals")
      .insert({
        user_id: context.userId,
        book_id: data.bookId,
        type: "online",
        status: "active",
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error("Payment processing failed");

    return { id: rental.id, alreadyActive: false };
  });

/**
 * OFFLINE BOOKING: reserve a physical book for counter pickup near HUST.
 * Generates a unique QR payload, decrements stock, 24h pickup window.
 */
export const bookOffline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { bookId: string; pickupLocation: string }) =>
    z
      .object({
        bookId: z.string().uuid(),
        pickupLocation: z.string().min(2).max(120),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: book } = await supabaseAdmin
      .from("books")
      .select("physical_stock")
      .eq("id", data.bookId)
      .single();
    if (!book || book.physical_stock <= 0) {
      throw new Error("This book is out of stock for pickup.");
    }

    const qrPayload = `HUSTLIB:${data.bookId.slice(0, 8)}:${crypto
      .randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;
    const end = new Date(Date.now() + 24 * 3_600_000);

    const { data: rental, error } = await supabaseAdmin
      .from("rentals")
      .insert({
        user_id: context.userId,
        book_id: data.bookId,
        type: "offline",
        status: "pending_pickup",
        end_date: end.toISOString(),
        qr_code: qrPayload,
        pickup_location: data.pickupLocation,
      })
      .select("id, qr_code, pickup_location, end_date")
      .single();
    if (error) throw new Error("Could not create booking");

    await supabaseAdmin
      .from("books")
      .update({ physical_stock: book.physical_stock - 1 })
      .eq("id", data.bookId);

    return rental;
  });
