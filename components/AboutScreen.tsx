"use client";

import { useState } from "react";
import { useReveal } from "@/lib/hooks/useReveal";
import { MISSION, HIGHLIGHTS, CONTACT_TIPS } from "@/app/data/about";
import { HighlightIcon } from "@/components/about/HighlightIcon";

type Form = { name: string; email: string; msg: string };

export function AboutScreen() {
  const dividerRef = useReveal();
  const contactRef = useReveal();

  const [form, setForm] = useState<Form>({ name: "", email: "", msg: "" });
  const [sent, setSent] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorInline, setErrorInline] = useState({ visible: false, msg: "" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    setErrorInline({ visible: false, msg: "" });
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          msg: form.msg.trim(),
        }),
      });

      if (res.ok) {
        setSent(form.name.trim());
      } else {
        const data = await res.json();
        setErrorInline({ visible: true, msg: data.error || "Error al enviar" });
      }
    } catch {
      setErrorInline({ visible: true, msg: "Error de conexión" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="about fade-in">
      {/* ABOUT */}
      <section className="about-hero">
        <div className="kicker pixel neon-yellow">▸ ACERCA DE</div>
        <h1 className="about-title">ACERCA DE ARCADE VAULT</h1>
        <p className="about-mission">{MISSION}</p>

        <div className="highlight-row">
          {HIGHLIGHTS.map((h, i) => (
            <div key={i} className={"highlight " + h.color} style={{ transitionDelay: i * 80 + "ms" }}>
              <HighlightIcon kind={h.icon} />
              <div className="hl-text pixel">{h.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* divider */}
      <div className="about-divider reveal" ref={dividerRef as React.RefObject<HTMLDivElement>} aria-hidden="true">
        <div className="div-bar"></div>
        <div className="div-pixels">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} style={{ animationDelay: i * 80 + "ms" }}></span>
          ))}
        </div>
        <div className="div-bar"></div>
      </div>

      {/* CONTACT */}
      <section className="about-contact reveal" ref={contactRef as React.RefObject<HTMLDivElement>}>
        <div className="contact-grid">
          <div className="contact-intro">
            <div className="kicker pixel neon-cyan">▸ CONTACTO</div>
            <h2 className="contact-title">CONTÁCTANOS</h2>
            <p className="contact-sub">
              ¿Tienes alguna sugerencia, quieres proponer un juego, o simplemente quieres saludar?
              Escríbenos.
            </p>
            <div className="contact-tips">
              {CONTACT_TIPS.map((tip, i) => (
                <div key={i} className="tip">
                  <span className={"tip-led" + (tip.led === "yellow" ? " y" : tip.led === "magenta" ? " m" : "")}></span>
                  {tip.text}
                </div>
              ))}
            </div>
          </div>

          <form className={"contact-form" + (shake ? " shake" : "")} onSubmit={onSubmit}>
            {!sent ? (
              <>
                <div className="field">
                  <label>NOMBRE</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="px_kai"
                  />
                </div>
                <div className="field">
                  <label>CORREO ELECTRÓNICO</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jugador@vault.gg"
                  />
                </div>
                <div className="field">
                  <label>MENSAJE</label>
                  <textarea
                    rows={5}
                    value={form.msg}
                    onChange={(e) => setForm({ ...form, msg: e.target.value })}
                    placeholder="Cuéntanos qué tienes en mente."
                  />
                </div>
                <button className="btn xl press" type="submit" style={{ width: "100%" }} disabled={loading}>
                  {loading ? "▸ ENVIANDO..." : "▶ ENVIAR MENSAJE"}
                </button>
                {errorInline.visible && (
                  <p style={{ color: "#ff4444", marginTop: 8, fontSize: 14 }}>{errorInline.msg}</p>
                )}
              </>
            ) : (
              <div className="terminal-success">
                <div className="term-bar">
                  <span className="dot r"></span>
                  <span className="dot y"></span>
                  <span className="dot g"></span>
                  <span className="term-title">VAULT-OS // TERMINAL</span>
                </div>
                <div className="term-body">
                  <div className="line">
                    <span className="prompt">vault@arcade:~$</span> ./send_message --to=team
                  </div>
                  <div className="line dim">[OK] Conectando con servidor.</div>
                  <div className="line dim">[OK] Validando contenido.</div>
                  <div className="line dim">[OK] Transmitiendo paquete.</div>
                  <div className="line success">
                    &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {sent.toUpperCase()}.
                    <span className="caret">_</span>
                  </div>
                  <div style={{ marginTop: 18 }}>
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() => {
                        setSent(null);
                        setForm({ name: "", email: "", msg: "" });
                      }}
                    >
                      ENVIAR OTRO MENSAJE
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
