import { cache } from "react";
import { supabasePublic } from "@/lib/supabase/public";

export type PublicDonor = {
  display_name: string | null;
  total_donated_cents: number;
  updated_at: string;
};

export type Totals = {
  raised_cents: number;
  donor_count: number;
  donation_count: number;
};

const FALLBACK_TOTALS: Totals = { raised_cents: 0, donor_count: 0, donation_count: 0 };

export const getTotals = cache(async (): Promise<Totals> => {
  const { data, error } = await supabasePublic
    .from("totals")
    .select("raised_cents,donor_count,donation_count")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return FALLBACK_TOTALS;
  return data as Totals;
});

export const getPublicDonors = cache(async (limit = 5): Promise<PublicDonor[]> => {
  const { data, error } = await supabasePublic
    .from("donors")
    .select("display_name,total_donated_cents,updated_at")
    .eq("list_public", true)
    .gt("total_donated_cents", 0)
    .order("total_donated_cents", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as PublicDonor[];
});

export type RecentDonor = {
  display_name: string;
  total_donated_cents: number;
  updated_at: string;
};

export const getMostRecentDonor = cache(async (): Promise<RecentDonor | null> => {
  const { data, error } = await supabasePublic
    .from("donors")
    .select("display_name,total_donated_cents,updated_at")
    .eq("list_public", true)
    .not("display_name", "is", null)
    .gt("total_donated_cents", 0)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data || !data.display_name) return null;
  return data as RecentDonor;
});
