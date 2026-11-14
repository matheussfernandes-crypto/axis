# Axis · contexto para continuar o desenvolvimento

Produto SaaS de gestão de obras para construtoras (dono: Matheus Santana Fernandes, MSF Engenharia).
Nasceu do sistema de medições da SBJ, mas é um produto NOVO: **nunca trazer dados, nomes ou
logos da SBJ** — só o funcionamento.

## Infra
- Código: GitHub `matheussfernandes-crypto/axis` (privado), branch `main`.
- Deploy: Vercel, projeto `axis` (time `medicoessbj`) → https://axis-mu-two.vercel.app (deploy automático a cada push).
- Banco: Supabase, projeto **Axis** `deyvvquqmdouykjuqqtc` (sa-east-1). Scripts aplicados em `supabase/axis/01..07`.
- Variáveis na Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Regras de arquitetura (não quebrar)
- **Multiempresa**: toda tabela de negócio tem `construtora_id` (default `minha_construtora()`) e uma
  política RLS `as restrictive` de isolamento. Tabela nova = mesma coisa (ver bloco "isolamento" em 02).
- Storage: arquivos sempre em `<construtora_id>/...` (políticas exigem a pasta). Buckets: contratos,
  fechamentos-pdfs, obra-fotos, logos.
- Nunca usar a service role para ler/gravar dados de negócio (bypassa o isolamento).
- PDFs: gerar dentro de `comMarca(supabase, async () => renderToBuffer(...))` (lib/pdf/marca.ts) para
  sair com nome e logo da construtora.
- Obras: status `EM_ANDAMENTO | CONCLUIDA | ENTREGUE`; telas de lançamento usam a view
  `obras_visibilidade` com `operacional = true` (entregue some 4 meses após `data_entrega_real`).
- Gestor de acessos = ADMIN aprovado da própria construtora (lib/acessos/gestor.ts).
- Marca: preto #0B0B0B/#111111, cinza claro #E6E6E6, cinzas #6E6E6E/#A8A8A8; fontes Space Grotesk
  (títulos, classe `font-display`) e Inter. Logo em components/LogoAxis.tsx. Abertura oficial = "B ·
  Cruzamento primeiro" (public/marca/intro.*); carregamento = "A · Eixo correndo" (components/CarregandoAxis.tsx).
- iPhone/iPad: barra de abas inferior (components/BarraInferior.tsx) abaixo de 1024 px, áreas seguras
  (viewport-fit=cover), campos com 16 px em telas de toque. Manter tudo usável com o dedo (≥ 44 px).

## Próximos passos combinados
1. Etapa 2: Andamento de Obra com modelo próprio por construtora (no sistema original as funções
   `an_*` usam um modelo global — precisam ser reescritas por construtora).
2. Etapa 3: Vistoria/Pós-obra e Pós-venda (só obras CONCLUIDA/ENTREGUE aparecem lá).
3. Planos e preços (tabela `planos`, vazia) e cobrança automática (Asaas ou Mercado Pago) → `faturas`.
4. Supabase → Authentication → URL Configuration: Site URL e Redirect URLs com o domínio da Vercel.
5. Tornar o próprio Matheus `axis_admins` depois do primeiro cadastro.

Idioma: tudo em português do Brasil, linguagem simples (o usuário é engenheiro civil, não programador).
