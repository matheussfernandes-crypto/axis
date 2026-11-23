import { createElement, type ReactNode } from "react";
import { Circle, Document, Image, Page, Path, Polygon, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";

// Folha de especificação (louças e metais, eletros, vidros e box) em paisagem.
// Sai só com o logo enviado no projeto: nenhum nome de sistema aparece na folha.

export type ItemPdf = { id: string; material: string; texto: string; medidas: string; qtd: number; foto?: string; desenho?: string };
export type AmbientePdf = { nome: string; itens: ItemPdf[] };

const COR = { escuro: "#111111", linha: "#d9d9d9", zebra: "#f6f6f6", texto: "#151515", suave: "#6e6e6e" };

const s = StyleSheet.create({
  page: { paddingTop: 24, paddingBottom: 34, paddingHorizontal: 26, fontFamily: "Helvetica", color: COR.texto },
  topo: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1.5, borderBottomColor: COR.escuro, paddingBottom: 7, marginBottom: 10 },
  logoBox: { width: 110, height: 44, justifyContent: "center" },
  logo: { maxWidth: 110, maxHeight: 44, objectFit: "contain" },
  centro: { flex: 1, alignItems: "center", paddingHorizontal: 10 },
  titulo: { fontSize: 14, fontWeight: 700, color: COR.escuro, textTransform: "uppercase", letterSpacing: 0.6 },
  sub: { fontSize: 8.5, color: "#444", marginTop: 3 },
  dir: { width: 110, alignItems: "flex-end" },
  dirTxt: { fontSize: 7.5, color: "#444", lineHeight: 1.5 },
  obs: { backgroundColor: "#f1f1f1", borderLeftWidth: 2.5, borderLeftColor: COR.escuro, paddingVertical: 5, paddingHorizontal: 8, marginBottom: 10, fontSize: 8.5, fontWeight: 700 },
  grade: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  amb: { width: "49%", marginBottom: 12 },
  ambNome: { fontSize: 9.5, fontWeight: 700, color: COR.escuro, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 },
  linha: { flexDirection: "row" },
  th: { backgroundColor: COR.escuro, color: "#fff", fontSize: 6.4, fontWeight: 700, textTransform: "uppercase", paddingVertical: 3.5, paddingHorizontal: 4, borderWidth: 0.4, borderColor: COR.escuro },
  td: { fontSize: 7.6, paddingVertical: 4, paddingHorizontal: 4, borderWidth: 0.4, borderColor: COR.linha, justifyContent: "center" },
  mat: { fontSize: 7, fontWeight: 700, color: COR.escuro },
  vazio: { fontSize: 9, color: COR.suave, marginTop: 20, textAlign: "center" },
  rodape: { position: "absolute", bottom: 14, left: 26, right: 26, flexDirection: "row", justifyContent: "space-between", fontSize: 6.5, color: COR.suave, borderTopWidth: 0.5, borderTopColor: COR.linha, paddingTop: 4 },
});

export function EspecificacaoPdf({
  papel, titulo, subtitulo, rev, emitido, obs, logo, medidas, vidros, arquivo, ambientes,
}: {
  papel: "A3" | "A4"; titulo: string; subtitulo: string; rev: string; emitido: string; obs: string; logo?: string;
  medidas: boolean; vidros: boolean; arquivo: string; ambientes: AmbientePdf[];
}) {
  const a3 = papel === "A3";
  const w = { im: vidros ? (a3 ? 118 : 96) : a3 ? 66 : 54, mt: a3 ? 92 : 78, md: a3 ? 92 : 78, qt: 26 };
  const fotoAlt = vidros ? (a3 ? 78 : 62) : a3 ? 46 : 38;
  return (
    <Document title={arquivo}>
      <Page size={papel} orientation="landscape" style={s.page}>
        <View style={s.topo} fixed>
          <View style={s.logoBox}>{logo ? <Image style={s.logo} src={logo} /> : null}</View>
          <View style={s.centro}>
            <Text style={s.titulo}>{titulo}</Text>
            {subtitulo ? <Text style={s.sub}>{subtitulo}</Text> : null}
          </View>
          <View style={s.dir}>
            <Text style={s.dirTxt}>Revisão {rev}</Text>
            <Text style={s.dirTxt}>Emitido em {emitido}</Text>
          </View>
        </View>

        {obs ? <Text style={s.obs}>{obs}</Text> : null}
        {!ambientes.length ? <Text style={s.vazio}>Nenhum item especificado neste grupo.</Text> : null}

        <View style={s.grade}>
          {ambientes.map((a) => (
            <View key={a.nome} style={s.amb} wrap={false}>
              <Text style={s.ambNome}>{a.nome}</Text>
              <View style={s.linha}>
                <Text style={[s.th, { width: w.im }]}>Imagem</Text>
                <Text style={[s.th, { width: w.mt }]}>Material</Text>
                <Text style={[s.th, { flex: 1 }]}>{vidros ? "Descrição" : "Referência"}</Text>
                {medidas ? <Text style={[s.th, { width: w.md }]}>Medidas</Text> : null}
                <Text style={[s.th, { width: w.qt, textAlign: "center" }]}>Qtd.</Text>
              </View>
              {a.itens.map((i, k) => {
                const fundo = k % 2 ? { backgroundColor: COR.zebra } : {};
                return (
                  <View key={i.id} style={s.linha}>
                    <View style={[s.td, fundo, { width: w.im, alignItems: "center" }]}>
                      {i.foto ? (
                        <Image src={i.foto} style={{ width: w.im - 8, height: fotoAlt, objectFit: "contain" }} />
                      ) : i.desenho ? (
                        svgParaPdf(i.desenho, w.im - 8, fotoAlt)
                      ) : (
                        <View style={{ width: w.im - 8, height: fotoAlt }} />
                      )}
                    </View>
                    <View style={[s.td, fundo, { width: w.mt }]}><Text style={s.mat}>{i.material}</Text></View>
                    <View style={[s.td, fundo, { flex: 1 }]}><Text>{i.texto}</Text></View>
                    {medidas ? <View style={[s.td, fundo, { width: w.md }]}><Text style={{ fontSize: 7.2, color: "#444" }}>{i.medidas}</Text></View> : null}
                    <View style={[s.td, fundo, { width: w.qt, alignItems: "center" }]}><Text style={{ fontWeight: 700 }}>{i.qtd}</Text></View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={s.rodape} fixed>
          <Text>{arquivo}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

// ---------- desenho do vidro: o SVG (gerado por lib/especificacoes/desenho.ts) vira elementos do PDF ----------
type No = { tag: string; at: Record<string, string>; filhos: No[]; texto?: string };

function lerSvg(svg: string): No {
  const raiz: No = { tag: "raiz", at: {}, filhos: [] };
  const pilha = [raiz];
  const re = /<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg))) {
    const topo = pilha[pilha.length - 1];
    if (m[5] !== undefined) {
      if (m[5].trim()) topo.filhos.push({ tag: "#t", at: {}, filhos: [], texto: m[5] });
      continue;
    }
    if (m[1]) {
      if (pilha.length > 1) pilha.pop();
      continue;
    }
    const at: Record<string, string> = {};
    for (const a of Array.from(m[3].matchAll(/([a-zA-Z-]+)="([^"]*)"/g))) at[a[1]] = a[2];
    const no: No = { tag: m[2], at, filhos: [] };
    topo.filhos.push(no);
    if (!m[4]) pilha.push(no);
  }
  return raiz;
}

const NOMES: Record<string, string> = {
  "stroke-width": "strokeWidth", "fill-opacity": "fillOpacity", "text-anchor": "textAnchor", "font-size": "fontSize",
};
const COMPONENTES: Record<string, any> = { rect: Rect, path: Path, circle: Circle, polygon: Polygon, text: Text };

function props(at: Record<string, string>) {
  const p: Record<string, any> = {};
  for (const [k, v] of Object.entries(at)) {
    if (k === "style" || k === "xmlns" || k === "role" || k === "font-family" || k === "viewBox") continue;
    const nome = NOMES[k] ?? k;
    p[nome] = /^-?(\d+\.?\d*|\.\d+)$/.test(v) && nome !== "points" ? Number(v) : v;
  }
  return p;
}

function montar(no: No, chave: number): ReactNode {
  if (no.tag === "#t") return no.texto ?? "";
  // grupo (<g>) não funciona bem no gerador de PDF: as cores/traços dele descem para cada peça
  if (no.tag === "g") return no.filhos.map((f, k) => montar(f.tag === "#t" ? f : { ...f, at: { ...no.at, ...f.at } }, chave * 1000 + k));
  // <line> com traço falha no gerador de PDF: vira um caminho (path) equivalente
  if (no.tag === "line") {
    const { x1, y1, x2, y2, ...resto } = no.at;
    return montar({ tag: "path", at: { ...resto, d: `M${x1},${y1} L${x2},${y2}`, fill: "none" }, filhos: [] }, chave);
  }
  const C = COMPONENTES[no.tag];
  if (!C) return null;
  // texto girado (cota da altura) vem só com transform: o PDF precisa de x/y explícitos
  const extra = no.tag === "text" ? { x: 0, y: 0, style: { fontFamily: "Helvetica" } } : {};
  return createElement(C, { key: chave, ...extra, ...props(no.at) }, ...no.filhos.map(montar));
}

function svgParaPdf(svg: string, largura: number, altura: number) {
  const raiz = lerSvg(svg).filhos.find((n) => n.tag === "svg");
  if (!raiz) return null;
  return (
    <Svg viewBox={raiz.at.viewBox || "0 0 240 160"} style={{ width: largura, height: altura }}>
      {raiz.filhos.map(montar)}
    </Svg>
  );
}
