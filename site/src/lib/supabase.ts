import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jcehskfmxeyejramdoce.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZWhza2ZteGV5ZWpyYW1kb2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0OTY5NzAsImV4cCI6MjA5MDA3Mjk3MH0.B5xeLOTU7Q3WadM1OM2hUV76XwFqhVfxBh_w5Li1Z7Y";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
