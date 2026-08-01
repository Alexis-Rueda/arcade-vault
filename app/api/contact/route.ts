import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email/resend";

function validate(body: Record<string, unknown>): string | null {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const msg = typeof body.msg === "string" ? body.msg.trim() : "";

  if (name.length < 2 || name.length > 80) {
    return "name: debe tener entre 2 y 80 caracteres";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return "email: formato inválido";
  }
  if (msg.length < 10 || msg.length > 5000) {
    return "msg: debe tener entre 10 y 5000 caracteres";
  }

  return null;
}

export async function POST(req: Request) {
  const body = await req.json();

  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json(
      { ok: false, error: validationError },
      { status: 400 }
    );
  }

  const name = (body.name as string).trim();
  const email = (body.email as string).trim();
  const msg = (body.msg as string).trim();

  const result = await sendContactEmail({ name, email, msg });

  if (result.ok) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (result.error === "RESEND_TO no configurado") {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { ok: false, error: result.error || "No se pudo enviar el correo" },
    { status: 502 }
  );
}
