// Carregamento oficial (A · Eixo correndo): o tracejado corre e o "A" se desenha e apaga.
// Só CSS — leve e sem JavaScript, aparece na hora do clique enquanto a página carrega.
const CSS =
  ".ax-load{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;min-height:55vh;width:100%}" +
  ".ax-load .ic{width:88px;height:88px;border-radius:22px;background:#111;border:1px solid #2a2a2a;display:flex;align-items:center;justify-content:center}" +
  ".ax-load .lam{stroke-dasharray:1;animation:ax-lam 2.2s cubic-bezier(.65,0,.35,1) infinite}" +
  ".ax-load .eixo{animation:ax-marcha 1.1s linear infinite}" +
  ".ax-load .st{font:500 12px Inter,system-ui,sans-serif;letter-spacing:.3em;color:#8a8a8a}" +
  "@keyframes ax-marcha{to{stroke-dashoffset:-30}}" +
  "@keyframes ax-lam{0%{stroke-dashoffset:1}45%,70%{stroke-dashoffset:0}100%{stroke-dashoffset:-1}}" +
  "@media (prefers-reduced-motion:reduce){.ax-load .lam,.ax-load .eixo{animation:none;stroke-dashoffset:0}}";

export default function CarregandoAxis({ className = "" }: { className?: string }) {
  return (
    <div role="status" aria-live="polite" aria-label="Carregando" className={"ax-load " + className}>
      <style>{CSS}</style>
      <div className="ic">
        <svg viewBox="0 0 104 84" width="54" aria-hidden="true">
          <polyline className="lam" pathLength={1} points="22,80 52,8 82,80" fill="none" stroke="#E6E6E6" strokeWidth="6" />
          <line className="eixo" x1="0" y1="56" x2="104" y2="56" stroke="#7A7A7A" strokeWidth="2.5" strokeDasharray="10 5 2 5" />
        </svg>
      </div>
      <span className="st">CARREGANDO</span>
    </div>
  );
}
