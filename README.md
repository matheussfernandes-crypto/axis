# Axis · Gestão de obras

Sistema para construtoras: obras, medições e vales de empreiteiros, contratos de terceirizados,
fechamento mensal com PDF, financeiro e controle de acessos. Cada construtora tem seu próprio
espaço, isolado no banco de dados.

Stack: Next.js 14 + Supabase (Postgres, Auth, Storage, RLS) + Vercel.

## Publicar (≈ 5 minutos)

1. **GitHub** — crie um repositório **privado** chamado `axis` e envie este código para ele.
2. **Vercel** — em vercel.com: *Add New → Project* → importe o repositório `axis`.
3. Em *Environment Variables*, cole as duas variáveis do arquivo `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Clique em **Deploy**. O site fica no ar em `https://axis-<algo>.vercel.app`.
5. No Supabase (projeto **Axis**) → *Authentication → URL Configuration*: coloque o endereço da
   Vercel em **Site URL** e em **Redirect URLs** (`https://SEU-SITE.vercel.app/**`). Assim os
   e-mails de confirmação e de troca de senha voltam para o site certo.

## Primeiro acesso

- Abra o site → **Criar conta** → aba **Nova construtora**. Quem cria a construtora já entra como
  administrador, com 30 dias de teste.
- Para a equipe: em **Administração → Dados da construtora** está o **código de convite**. A pessoa
  usa a aba **Entrar numa equipe** e o administrador aprova em **Aprovação de logins**.
- Para você gerenciar todas as construtoras (planos, faturas), depois do seu cadastro rode no
  Supabase (SQL Editor): `insert into axis_admins (user_id) select id from auth.users where email = 'SEU-EMAIL';`

## O que tem nesta versão (etapa 1)

- Cadastro de Obras com situação: **Em andamento**, **Concluída** (sai do painel/andamento) e
  **Entregue** (continua em medições e contratos por 4 meses após a entrega; depois só Pós-obra).
- Medições e vales de empreiteiros próprios, retenção, retiradas e fechamento mensal com PDF.
- Contratos de terceirizados: itens, aditivos, medições, autorização com glosa, fechamento e histórico.
- Financeiro: painel de gastos e extrato de retidos.
- **Logotipo da construtora** (PNG quadrado) em todos os PDFs.
- **Licença e mensalidades**: plano atual, outros planos e faturas (tabelas `planos` e `faturas`).
- Abertura animada da marca (uma vez por sessão) e carregamento animado.

Próximas etapas: Andamento de Obra (modelo por construtora), Vistoria/Pós-obra e Pós-venda,
cobrança automática (Asaas/Mercado Pago).

## Segurança

- Isolamento por construtora no próprio banco (coluna `construtora_id` + política RLS *restrictive*
  em todas as tabelas), inclusive nos arquivos do Storage (pasta por construtora).
- Usuário comum não consegue mudar o próprio setor, status ou construtora (gatilho no banco).
- Funções internas não podem ser chamadas sem login.
- Cabeçalhos de segurança (HSTS, anti-iframe, nosniff) em todas as páginas.

## Banco de dados

Os scripts estão em `supabase/axis/` (já aplicados no projeto Axis do Supabase).

## Desenvolvimento local

```bash
cp .env.example .env.local
npm install
npm run dev
```
