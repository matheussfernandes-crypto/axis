import { NextRequest, NextResponse } from "next/server";
import { comMarca } from "@/lib/pdf/marca";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { carregarAndamento } from "../../dados";
import { RelatorioAndamentoPdf } from "@/lib/pdf/RelatorioAndamentoPdf";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  const { data: perfil } = await supabase.from("perfis").select("status").eq("id", user.id).single();
  if (!perfil || perfil.status !== "aprovado") return NextResponse.json({ erro: "Acesso restrito." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const obraId = searchParams.get("obra") || "";
  if (!obraId) return NextResponse.json({ erro: "Informe a obra." }, { status: 400 });

  const { data: obra } = await supabase.from("obras").select("nome").eq("id", obraId).single();
  if (!obra) return NextResponse.json({ erro: "Obra não encontrada." }, { status: 404 });

  const dados = await carregarAndamento(obraId);

  const buffer = await comMarca(supabase, async () => renderToBuffer(
    RelatorioAndamentoPdf({
      obraNome: obra.nome,
      dados,
      dataGeracao: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    })
  ));
  const nome = `andamento-${obra.nome}.pdf`.replace(/[^a-zA-Z0-9._-]/g, "_");
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${nome}"` },
  });
}
