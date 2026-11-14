// Logotipo Axis (vetor): "A" sem travessão cortado pela linha de eixo + X de dois traços + "IS".
// Usa currentColor para o traço principal; o segundo traço do X e o eixo usam o cinza da marca.
export default function LogoAxis({ className = "h-8", cinza = "#6E6E6E" }: { className?: string; cinza?: string }) {
  return (
    <svg viewBox="-128 30 640 150" className={className} role="img" aria-label="Axis">
      <line x1="-120" y1="126" x2="150" y2="126" stroke={cinza} strokeWidth="5" strokeDasharray="26 10 6 10" />
      <polyline points="12,170 71,44 130,170" fill="none" stroke="currentColor" strokeWidth="12" />
      <line x1="150" y1="44" x2="250" y2="170" stroke="currentColor" strokeWidth="12" />
      <line x1="250" y1="44" x2="150" y2="170" stroke={cinza} strokeWidth="12" />
      <text x="262" y="170" fontSize="186" fontWeight={300} fontFamily="'Space Grotesk', sans-serif" fill="currentColor">IS</text>
    </svg>
  );
}

// Só o símbolo (A + eixo), para ícone e espaços pequenos
export function SimboloAxis({ className = "h-6", cinza = "#7A7A7A" }: { className?: string; cinza?: string }) {
  return (
    <svg viewBox="0 0 104 84" className={className} role="img" aria-label="Axis">
      <polyline points="22,80 52,8 82,80" fill="none" stroke="currentColor" strokeWidth="7" />
      <line x1="0" y1="56" x2="104" y2="56" stroke={cinza} strokeWidth="3" strokeDasharray="10 5 2 5" />
    </svg>
  );
}
