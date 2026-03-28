import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { ProgrammeDetailsClient } from "./ProgrammeDetailsClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  const { data: programme } = await supabase
    .from("programmes")
    .select("title, subtitle")
    .eq("id", id)
    .single();

  if (!programme) {
    return {
      title: "Programme Not Found",
    };
  }

  return {
    title: programme.title,
    description: programme.subtitle,
  };
}

export default async function ProgrammeDetails({ params }: Props) {
  const { id } = await params;

  const { data: programme, error } = await supabase
    .from("programmes")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error || !programme) {
    notFound();
  }

  return <ProgrammeDetailsClient programme={programme} />;
}
