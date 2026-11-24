import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/lib/auth/getCurrentUserProfile";
import ListaEmpresas, { type Empresa } from "./ListaEmpresas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Empresas do Axis" };

// Só o dono do Axis: todas as empresas cadastradas, aceite/suspensão e entrar no site de cada uma.
export default async function PlataformaPage() {
  const empresa = await getEmpresaAtual();
  if (!empresa?.ehAxisAdmin) redirect("/dashboard");
  const supabase = createClient();
  const { data, error } = await supabase.rpc("plataforma_empresas");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-primaryDark">Empresas do Axis</h1>
        <p className="text-sm text-ink-500">
          Todas as empresas cadastradas. Empresa nova fica <b>pendente</b> até você aceitar. Use <b>Entrar</b> para ver e mexer no site dela como se fosse dela.
        </p>
      </div>
      {error && <div className="rounded-[10px] border border-[#F1C4BF] bg-[#FDECEA] px-3 py-2 text-sm text-[#B3261E]">{error.message}</div>}
      <ListaEmpresas empresas={(data ?? []) as Empresa[]} atual={empresa.id} propria={empresa.propriaId} />
    </div>
  );
}
