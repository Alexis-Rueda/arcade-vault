import { Resend } from "resend";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendContactEmail({
  name,
  email,
  msg,
}: {
  name: string;
  email: string;
  msg: string;
}): Promise<{ ok: boolean; error?: string }> {
  const to = process.env.RESEND_TO;
  if (!to) {
    return { ok: false, error: "RESEND_TO no configurado" };
  }

  const from = process.env.RESEND_FROM || "onboarding@resend.dev";
  const apiKey = process.env.RESEND_API_KEY;

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMsg = escapeHtml(msg);

  const html = `
    <p><strong>${safeName}</strong> (${safeEmail}) te escribió desde el formulario de Arcade Vault:</p>
    <p>${safeMsg}</p>
  `;

  if (!apiKey) {
    console.log("[contact:log-only]", { to, from, name, email, msg });
    return { ok: true };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      subject: "[Arcade Vault] Nuevo mensaje de contacto",
      html,
    });

    if (error) {
      return { ok: false, error: error.message || "No se pudo enviar el correo" };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo enviar el correo";
    return { ok: false, error: message };
  }
}
