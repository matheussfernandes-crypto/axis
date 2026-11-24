-- AXIS · 12 · Projeto da arquitetura pode ter o nome da obra digitado livre (obra de cliente que não está cadastrada).
-- Se o nome bater com uma obra cadastrada, o site liga pelo obra_id; senão guarda só o texto aqui.
alter table public.esp_projetos add column if not exists obra_nome text;
