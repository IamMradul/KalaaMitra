import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { Trophy } from 'lucide-react';

async function getProfileData(user_id: string) {
  // Fetch user profile from Supabase
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user_id)
    .single();
  if (error || !profile) return { profile: null, mitraPoints: 0 };
  // Dynamically calculate MitraPoints (10 per auction win)
  const { data: auctions } = await supabase
    .from('auctions')
    .select('id')
    .eq('winner_id', user_id);
  const mitraPoints = auctions && Array.isArray(auctions) ? auctions.length * 10 : 0;
  return { profile, mitraPoints };
}






export default function Page() {
  // This page is temporarily disabled.
  return null;
}



export const dynamic = 'force-dynamic';
