import { createElement, type ReactNode } from "react";
import { Circle, Document, Image, Page, Path, Polygon, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";

// Folha de especificação (louças e metais, eletros, vidros e box) em paisagem, um ambiente embaixo do outro,
// no visual das tabelas da arquitetura: faixas bege, título em barra cinza-clara, tabela branca com bordas pretas finas
// e observação em vermelho. Ambiente curto não se divide entre páginas; ambiente longo continua na página seguinte,
// linha a linha (forçar um bloco maior que a página a ficar inteiro trava o gerador).
// Sai só com o logo enviado: nenhum nome de sistema aparece na folha.

export type ItemPdf = { id: string; material: string; texto: string; medidas: string; qtd: number; foto?: string; desenho?: string };
export type AmbientePdf = { nome: string; itens: ItemPdf[] };

const COR = { texto: "#000000", borda: "#000000", faixa: "#d3c7b6", barra: "#ebece8", alerta: "#ff3131", suave: "#6e6e6e" };
const FAIXA = 14;

const s = StyleSheet.create({
  page: { paddingTop: FAIXA + 14, paddingBottom: FAIXA + 46, paddingHorizontal: 30, fontFamily: "Helvetica", color: COR.texto },
  faixaTopo: { position: "absolute", top: 0, left: 0, right: 0, height: FAIXA, backgroundColor: COR.faixa },
  faixaBase: { position: "absolute", bottom: 0, left: 0, right: 0, height: FAIXA, backgroundColor: COR.faixa },
  barra: { backgroundColor: COR.barra, paddingVertical: 7, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", marginBottom: 10 },
  titulo: { flex: 1, textAlign: "center", fontSize: 13, fontFamily: "Helvetica-Oblique", letterSpacing: 1.6, textTransform: "uppercase" },
  rev: { position: "absolute", right: 12, top: 5, width: 120, fontSize: 6.8, color: "#444", textAlign: "right", lineHeight: 1.4 },
  dados: { marginBottom: 10 },
  dadoLinha: { flexDirection: "row", alignItems: "flex-end", marginBottom: 2 },
  dadoRot: { fontSize: 11, letterSpacing: 1.2, marginRight: 5 },
  dadoVal: { fontSize: 8.5, letterSpacing: 0.9, textTransform: "uppercase", paddingBottom: 1 },
  amb: { width: "100%", marginBottom: 12 },
  ambNome: { fontSize: 9.5, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 },
  linha: { flexDirection: "row" },
  th: { fontSize: 7, letterSpacing: 1, textTransform: "uppercase", textAlign: "center", paddingVertical: 4, paddingHorizontal: 4, borderWidth: 0.6, borderColor: COR.borda, marginLeft: -0.6 },
  td: { fontSize: 7.4, letterSpacing: 0.4, lineHeight: 1.35, paddingVertical: 4, paddingHorizontal: 6, borderWidth: 0.6, borderColor: COR.borda, marginLeft: -0.6, marginTop: -0.6, justifyContent: "center", alignItems: "center", textAlign: "center" },
  mat: { fontSize: 6.8, letterSpacing: 0.8, textTransform: "uppercase", textAlign: "center" },
  obs: { fontSize: 7.6, fontFamily: "Helvetica-Oblique", letterSpacing: 0.6, color: COR.alerta, marginTop: 2 },
  vazio: { fontSize: 9, color: COR.suave, marginTop: 20, textAlign: "center" },
  rodape: { position: "absolute", bottom: FAIXA + 6, left: 30, right: 30, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  rodTxt: { fontSize: 6, color: COR.suave, letterSpacing: 0.4 },
  logo: { maxWidth: 120, maxHeight: 30, objectFit: "contain" },
});

const doisDig = (n: number) => String(n).padStart(2, "0");

export function EspecificacaoPdf({
  papel, titulo, subtitulo, cliente, obra, rev, emitido, obs, logo, medidas, vidros, arquivo, ambientes,
}: {
  papel: "A3" | "A4"; titulo: string; subtitulo: string; cliente?: string; obra?: string; rev: string; emitido: string; obs: string; logo?: string;
  medidas: boolean; vidros: boolean; arquivo: string; ambientes: AmbientePdf[];
}) {
  const a3 = papel === "A3";
  const w = { mt: a3 ? 140 : 110, im: vidros ? (a3 ? 150 : 124) : a3 ? 120 : 100, md: a3 ? 130 : 110, qt: a3 ? 80 : 66 };
  const fotoAlt = vidros ? (a3 ? 90 : 74) : a3 ? 70 : 56;
  return (
    <Document title={arquivo}>
      <Page size={papel} orientation="landscape" style={s.page}>
        <View style={s.faixaTopo} fixed />
        <View style={s.faixaBase} fixed />

        <View style={s.barra}>
          <Text style={s.titulo}>{titulo}</Text>
          <View style={s.rev}>
            <Text>Revisão {rev}</Text>
            <Text>Emitido em {emitido}</Text>
          </View>
        </View>

        {cliente || obra ? (
          <View style={s.dados}>
            {cliente ? <View style={s.dadoLinha}><Text style={s.dadoRot}>CLIENTES:</Text><Text style={s.dadoVal}>{cliente}</Text></View> : null}
            {obra ? <View style={s.dadoLinha}><Text style={s.dadoRot}>OBRA:</Text><Text style={s.dadoVal}>{obra}</Text></View> : null}
          </View>
        ) : subtitulo ? (
          <View style={s.dados}><Text style={s.dadoVal}>{subtitulo}</Text></View>
        ) : null}

        {!ambientes.length ? <Text style={s.vazio}>Nenhum item especificado neste grupo.</Text> : null}

        {ambientes.map((a) => (
          <View key={a.nome} style={s.amb} wrap={a.itens.length > 3}>
            <Text style={s.ambNome} minPresenceAhead={fotoAlt + 40}>{a.nome}</Text>
            <View style={s.linha} minPresenceAhead={fotoAlt + 20}>
              <Text style={[s.th, { width: w.mt, marginLeft: 0 }]}>Item</Text>
              <Text style={[s.th, { width: w.im }]}>Imagem</Text>
              <Text style={[s.th, { flex: 1 }]}>{vidros ? "Descrição" : "Modelo sugerido"}</Text>
              {medidas ? <Text style={[s.th, { width: w.md }]}>Medidas</Text> : null}
              <Text style={[s.th, { width: w.qt }]}>Quantidade</Text>
            </View>
            {a.itens.map((i) => (
              <View key={i.id} style={s.linha} wrap={false}>
                <View style={[s.td, { width: w.mt, marginLeft: 0 }]}><Text style={s.mat}>{i.material}</Text></View>
                <View style={[s.td, { width: w.im }]}>
                  {i.foto ? (
                    <Image src={i.foto} style={{ width: w.im - 14, height: fotoAlt, objectFit: "contain" }} />
                  ) : i.desenho ? (
                    svgParaPdf(i.desenho, w.im - 14, fotoAlt)
                  ) : (
                    <View style={{ width: w.im - 14, height: fotoAlt }} />
                  )}
                </View>
                <View style={[s.td, { flex: 1 }]}><Text>{i.texto}</Text></View>
                {medidas ? <View style={[s.td, { width: w.md }]}><Text>{i.medidas}</Text></View> : null}
                <View style={[s.td, { width: w.qt }]}><Text>{doisDig(i.qtd)}</Text></View>
              </View>
            ))}
          </View>
        ))}

        {obs ? <Text style={s.obs}>{obs}</Text> : null}

        <View style={s.rodape} fixed>
          <View>
            <Text style={s.rodTxt}>{arquivo}</Text>
            <Text style={s.rodTxt} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
          </View>
          {logo ? <Image style={s.logo} src={logo} /> : null}
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
