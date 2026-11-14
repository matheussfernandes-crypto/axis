import { createClient } from "@/lib/supabase/server";

// Gestor de acessos = ADMIN aprovado da própria construtora.
export async function ehGestorDaConstrutora(supabase: ReturnType<typeof createClient>, userId: string): Promise<boolean> {
  const { data } = await supabase.from("perfis").select("setor, status").eq("id", userId).single();
  return data?.setor === "ADMIN" && data?.status === "aprovado";
}
