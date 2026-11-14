import { NextResponse, type NextRequest } from "next/server";

// Middleware síncrono — sem chamadas de rede (rápido). A segurança real fica em cada página
// (supabase.auth.getUser() no servidor) e no banco (RLS por construtora).
const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/^https?:\/\//, "").split(".")[0];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.length > 1 && path.endsWith("/")) {
    const url = new URL(request.url);
    url.pathname = path.replace(/\/+$/, "") || "/";
    return NextResponse.redirect(url, 308);
  }

  const rotasPublicas = ["/login", "/cadastro", "/esqueci-senha", "/redefinir-senha", "/privacidade", "/auth"];
  const isPublica = rotasPublicas.some((r) => path.startsWith(r));

  const cookieSession =
    request.cookies.get(`sb-${projectRef}-auth-token`) ??
    request.cookies.get(`sb-${projectRef}-auth-token.0`);
  const logado = !!cookieSession?.value;

  if (!logado && !isPublica) {
    if (path.startsWith("/api/")) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (logado && isPublica && path !== "/privacidade" && !path.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|icon-|apple-touch-icon|manifest|sw\\.js|logo-|marca/).*)"],
};
