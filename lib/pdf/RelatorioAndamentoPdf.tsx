import { marcaAtual } from "./marca";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { DadosAndamento } from "@/app/(app)/obras/andamento/dados";

function logo(): string | undefined {
  return marcaAtual().logo;
}

const COR_STATUS: Record<number, string> = { 0: "#e3e7e9", 1: "#f0a020", 2: "#24914f", 3: "#ffffff" };
const SIGLA_STATUS: Record<number, string> = { 0: "", 1: "A", 2: "F", 3: "—" };

const s = StyleSheet.create({
  page: { padding: 22, fontSize: 7.5, fontFamily: "Helvetica", color: "#151515" },
  header: { flexDirection: "row", alignItems: "center", borderBottomWidth: 2, borderBottomColor: "#111111", paddingBottom: 6, marginBottom: 8 },
  logo: { width: 38, height: 38, marginRight: 10 },
  title: { fontSize: 13, fontWeight: 700, color: "#111111" },
  sub: { fontSize: 7.5, color: "#444", marginTop: 2 },
  right: { marginLeft: "auto", textAlign: "right", fontSize: 7, color: "#444" },
  kpis: { flexDirection: "row", gap: 8, marginBottom: 10 },
  kpi: { flex: 1, backgroundColor: "#f1f1f1", borderRadius: 3, padding: 8 },
  kpiLbl: { fontSize: 6.5, color: "#65707d", textTransform: "uppercase" },
  kpiVal: { fontSize: 15, fontWeight: 700, marginTop: 2 },
  section: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", marginTop: 10, marginBottom: 4, color: "#141414" },
  row: { flexDirection: "row" },
  th: { backgroundColor: "#111111", color: "#fff", fontSize: 6, fontWeight: 700, padding: 2.5, borderWidth: 0.5, borderColor: "#333", textAlign: "center" },
  td: { fontSize: 6.8, padding: 2.5, borderWidth: 0.5, borderColor: "#333" },
  legenda: { flexDirection: "row", gap: 10, marginBottom: 6 },
  legItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  legCor: { width: 7, height: 7, borderWidth: 0.5, borderColor: "#999" },
  legTxt: { fontSize: 6.5, color: "#444" },
  foot: { position: "absolute", bottom: 14, left: 22, right: 22, fontSize: 6, color: "#888", flexDirection: "row", justifyContent: "space-between" },
});

export function RelatorioAndamentoPdf({
  obraNome,
  dados,
  dataGeracao,
}: {
  obraNome: string;
  dados: DadosAndamento;
  dataGeracao: string;
}) {
  const lg = logo();
  const percObra: any = dados.percentuais.find((p: any) => p.nivel === "obra");
  const percPavimentos = dados.percentuais.filter((p: any) => p.nivel === "pavimento");
  const percCategorias = dados.percentuais.filter((p: any) => p.nivel === "categoria");
  const statusMap = new Map(
    dados.apontamentos.filter((a: any) => a.local_id).map((a: any) => [`${a.local_id}:${a.servico_id}`, a.status])
  );
  const temPeso = new Set(dados.pesos.map((p: any) => `${p.categoria_id}:${p.servico_id}`));

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          {lg ? <Image style={s.logo} src={lg} /> : null}
          <View>
            <Text style={s.title}>ANDAMENTO DE OBRA — {obraNome.toUpperCase()}</Text>
            <Text style={s.sub}>Resumo ponderado por categoria e pavimento</Text>
          </View>
          <View style={s.right}><Text>{marcaAtual().nome}</Text><Text>Gerado em {dataGeracao}</Text></View>
        </View>

        <View style={s.kpis}>
          <View style={s.kpi}><Text style={s.kpiLbl}>% ponderado</Text><Text style={s.kpiVal}>{Number(percObra?.pct ?? 0).toFixed(1)}%</Text></View>
          <View style={s.kpi}><Text style={s.kpiLbl}>Finalizados</Text><Text style={s.kpiVal}>{percObra?.fin ?? 0}</Text></View>
          <View style={s.kpi}><Text style={s.kpiLbl}>Em andamento</Text><Text style={s.kpiVal}>{percObra?.andam ?? 0}</Text></View>
          <View style={s.kpi}><Text style={s.kpiLbl}>Não iniciados</Text><Text style={s.kpiVal}>{percObra?.nao ?? 0}</Text></View>
        </View>

        {percPavimentos.length > 0 && (
          <>
            <Text style={s.section}>Por pavimento</Text>
            <View style={s.row}>
              <View style={[s.th, { flex: 2 }]}><Text>Pavimento</Text></View>
              <View style={[s.th, { flex: 1 }]}><Text>%</Text></View>
              <View style={[s.th, { flex: 1 }]}><Text>Finalizado</Text></View>
              <View style={[s.th, { flex: 1 }]}><Text>Andamento</Text></View>
              <View style={[s.th, { flex: 1 }]}><Text>Não iniciado</Text></View>
            </View>
            {percPavimentos.map((p: any) => (
              <View style={s.row} key={p.ref_id}>
                <View style={[s.td, { flex: 2 }]}><Text>{p.nome}</Text></View>
                <View style={[s.td, { flex: 1, textAlign: "center" }]}><Text>{Number(p.pct).toFixed(1)}%</Text></View>
                <View style={[s.td, { flex: 1, textAlign: "center" }]}><Text>{p.fin}</Text></View>
                <View style={[s.td, { flex: 1, textAlign: "center" }]}><Text>{p.andam}</Text></View>
                <View style={[s.td, { flex: 1, textAlign: "center" }]}><Text>{p.nao}</Text></View>
              </View>
            ))}
          </>
        )}

        {percCategorias.length > 0 && (
          <>
            <Text style={s.section}>Por categoria</Text>
            <View style={s.row}>
              <View style={[s.th, { flex: 2 }]}><Text>Categoria</Text></View>
              <View style={[s.th, { flex: 1 }]}><Text>%</Text></View>
            </View>
            {percCategorias.map((c: any) => (
              <View style={s.row} key={c.ref_id}>
                <View style={[s.td, { flex: 2 }]}><Text>{c.nome}</Text></View>
                <View style={[s.td, { flex: 1, textAlign: "center" }]}><Text>{Number(c.pct).toFixed(1)}%</Text></View>
              </View>
            ))}
          </>
        )}

        <View style={s.foot}><Text>Axis · Andamento de Obra</Text><Text>Página 1</Text></View>
      </Page>

      {dados.pavimentos.map((pav: any, i: number) => {
        const locais = dados.locais.filter((l: any) => l.pavimento_id === pav.id);
        if (!locais.length) return null;
        return (
          <Page size="A3" orientation="landscape" style={s.page} key={pav.id}>
            <View style={s.header}>
              {lg ? <Image style={s.logo} src={lg} /> : null}
              <View>
                <Text style={s.title}>{obraNome.toUpperCase()} — {pav.nome.toUpperCase()}</Text>
                <Text style={s.sub}>Grade de apontamento por local e serviço</Text>
              </View>
              <View style={s.right}><Text>{marcaAtual().nome}</Text><Text>Gerado em {dataGeracao}</Text></View>
            </View>

            <View style={s.legenda}>
              <View style={s.legItem}><View style={[s.legCor, { backgroundColor: COR_STATUS[0] }]} /><Text style={s.legTxt}>Não iniciado</Text></View>
              <View style={s.legItem}><View style={[s.legCor, { backgroundColor: COR_STATUS[1] }]} /><Text style={s.legTxt}>Andamento (A)</Text></View>
              <View style={s.legItem}><View style={[s.legCor, { backgroundColor: COR_STATUS[2] }]} /><Text style={s.legTxt}>Finalizado (F)</Text></View>
              <View style={s.legItem}><View style={[s.legCor, { backgroundColor: COR_STATUS[3] }]} /><Text style={s.legTxt}>Ausência (—)</Text></View>
            </View>

            <View style={s.row}>
              <View style={[s.th, { flex: 2, textAlign: "left" }]}><Text>Local</Text></View>
              {dados.servicos.map((sv: any) => (
                <View style={[s.th, { flex: 1 }]} key={sv.id}><Text>{sv.nome}</Text></View>
              ))}
            </View>
            {locais.map((l: any) => (
              <View style={s.row} key={l.id}>
                <View style={[s.td, { flex: 2 }]}><Text>{l.nome}</Text></View>
                {dados.servicos.map((sv: any) => {
                  const aplicavel = temPeso.has(`${l.categoria_id}:${sv.id}`);
                  const st = statusMap.get(`${l.id}:${sv.id}`) ?? 0;
                  return (
                    <View style={[s.td, { flex: 1, textAlign: "center", backgroundColor: aplicavel ? COR_STATUS[st] : "#fafafa" }]} key={sv.id}>
                      <Text>{aplicavel ? SIGLA_STATUS[st] : "–"}</Text>
                    </View>
                  );
                })}
              </View>
            ))}

            <View style={s.foot}><Text>Axis · Andamento de Obra</Text><Text>Página {i + 2}</Text></View>
          </Page>
        );
      })}
    </Document>
  );
}
