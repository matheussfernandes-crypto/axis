import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase/service";

function initWebPush(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  try {
    webpush.setVapidDetails("mailto:contato@axis.app.br", pub, priv);
    return true;
  } catch {
    return false;
  }
}

async function enviarParaIds(
  userIds: string[],
  payload: { title: string; body: string; url?: string }
) {
  if (!userIds.length || !initWebPush()) return;

  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    return; // sem service role key: silencioso
  }

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (!subs?.length) return;

  const mensagem = JSON.stringify(payload);

  await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          mensagem
        )
        .catch(() => null)
    )
  );

  // Salva no inbox de notificações (para visualização no app)
  const rows = userIds.map((uid) => ({
    usuario_id: uid,
    titulo: payload.title,
    corpo: payload.body ?? null,
    url: payload.url ?? null,
  }));
  // Salva no inbox — erros silenciados para não quebrar o fluxo
  try { await supabase.from("notificacoes").insert(rows); } catch {}
}

// Avisa os ADMIN aprovados da MESMA construtora de quem disparou a ação (nunca de outras).
export async function notificarAdmins(
  payload: { title: string; body: string; url?: string },
  opts: { construtoraId?: string | null; email?: string } = {}
) {
  try {
    const supabase = createServiceClient();
    let construtoraId = opts.construtoraId ?? null;
    if (!construtoraId && opts.email) {
      const { data } = await supabase.from("perfis").select("construtora_id").eq("email", opts.email).maybeSingle();
      construtoraId = data?.construtora_id ?? null;
    }
    if (!construtoraId) {
      const { createClient } = await import("@/lib/supabase/server");
      const sessao = createClient();
      const { data: { user } } = await sessao.auth.getUser();
      if (user) {
        const { data } = await sessao.from("perfis").select("construtora_id").eq("id", user.id).single();
        construtoraId = data?.construtora_id ?? null;
      }
    }
    if (!construtoraId) return;
    const { data: admins } = await supabase
      .from("perfis")
      .select("id")
      .eq("construtora_id", construtoraId)
      .eq("setor", "ADMIN")
      .eq("status", "aprovado");

    if (!admins?.length) return;
    await enviarParaIds(admins.map((a) => a.id), payload);
  } catch {
    // silencioso — não quebrar o fluxo principal
  }
}

export async function notificarUsuarios(
  userIds: string[],
  payload: { title: string; body: string; url?: string }
) {
  try {
    await enviarParaIds(userIds, payload);
  } catch {
    // silencioso
  }
}
