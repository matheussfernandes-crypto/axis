"use client";

import { useState } from "react";
import FormAcao from "@/components/contratos/FormAcao";
import Selecao from "@/components/ui/Selecao";
import { adicionarItens } from "../actions";
import { UNIDADES } from "@/lib/contratos/util";

type Preco = { id: string; servico: string; unidade: string; valor_unitario: number };

const br = (n: number) => String(n).replace(".", ",");

/** Formulário "Adicionar item": ao escolher um preço já cadastrado, preenche
 *  descrição, unidade e valor unitário sozinho; continua dando pra editar à mão. */
export default function ItemFormManual({ contratoId, precos }: { contratoId: string; precos: Preco[] }) {
  const [precoId, setPrecoId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [unidade, setUnidade] = useState("m²");
  const [valorUnitario, setValorUnitario] = useState("");

  function escolherPreco(id: string) {
    setPrecoId(id);
    const p = precos.find((x) => x.id === id);
    if (p) {
      setDescricao(p.servico);
      setUnidade(p.unidade);
      setValorUnitario(br(p.valor_unitario));
    }
  }

  function limpar() {
    setPrecoId("");
    setDescricao("");
    setUnidade("m²");
    setValorUnitario("");
  }

  return (
    <FormAcao action={adicionarItens} onSucesso={limpar} className="grid grid-cols-6 gap-2 text-xs items-end">
      <input type="hidden" name="contratoId" value={contratoId} />
      <p className="col-span-6 font-semibold text-ink-700 text-sm">Adicionar item</p>

      {precos.length > 0 && (
        <label className="col-span-6 flex flex-col gap-1">
          Preço cadastrado
          <Selecao value={precoId} onChange={(e) => escolherPreco(e.target.value)} className="border rounded px-2 py-1.5">
            <option value="">Personalizado (preencher manualmente)</option>
            {precos.map((p) => (
              <option key={p.id} value={p.id}>{p.servico} — {p.unidade} — R$ {br(p.valor_unitario)}</option>
            ))}
          </Selecao>
        </label>
      )}

      <label className="col-span-1 flex flex-col gap-1">Código<input name="codigo" placeholder="1.1" className="border rounded px-2 py-1.5" /></label>
      <label className="col-span-5 flex flex-col gap-1">Descrição *
        <input name="descricao" required value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Assentamento de porcelanato" className="border rounded px-2 py-1.5" />
      </label>
      <label className="col-span-2 flex flex-col gap-1">Unidade
        <input name="unidade" list="unidades" value={unidade} onChange={(e) => setUnidade(e.target.value)} className="border rounded px-2 py-1.5" />
      </label>
      <label className="col-span-2 flex flex-col gap-1">Quantidade<input name="quantidade" inputMode="decimal" required className="border rounded px-2 py-1.5" /></label>
      <label className="col-span-2 flex flex-col gap-1">Valor unit. (R$)
        <input name="valorUnitario" inputMode="decimal" required value={valorUnitario} onChange={(e) => setValorUnitario(e.target.value)} className="border rounded px-2 py-1.5" />
      </label>
      <button className="col-span-6 bg-primary text-white rounded px-3 py-2 font-semibold">Adicionar</button>
      <datalist id="unidades">{UNIDADES.map((u) => <option key={u} value={u} />)}</datalist>
    </FormAcao>
  );
}
