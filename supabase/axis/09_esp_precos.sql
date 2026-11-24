-- AXIS · 09 · Especificações: até 3 preços pesquisados por modelo do catálogo e por item do projeto.
-- Cada preço: { "loja": text, "valor": number, "link": text, "data": "AAAA-MM-DD" }. A média é calculada no site.
alter table public.esp_modelos add column if not exists precos jsonb not null default '[]'::jsonb;
alter table public.esp_itens   add column if not exists precos jsonb not null default '[]'::jsonb;
