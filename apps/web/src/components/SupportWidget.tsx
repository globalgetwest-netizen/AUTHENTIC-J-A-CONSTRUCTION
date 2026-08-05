"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { COMPANY, telHref, type RequestTypeKey } from "../config/company";
import { Icon } from "./icons";

/**
 * Premium customer-support widget for the public site.
 *
 * Appears only on key customer-facing pages (homepage, /request, and the
 * services / properties / contact / appointment routes as they ship). Anchored
 * bottom-right, fades in on load, never auto-opens, no bounce/pulse. A message
 * is stored as a CRM lead through the same pipeline as the request form, so
 * enquiries reach the appropriate department for follow-up.
 */

const SHOW_ON_PREFIXES = ["/request", "/book", "/appointment", "/services", "/properties", "/contact"];

const QUICK_OPTIONS: { label: string; type: RequestTypeKey }[] = [
  { label: "Request a Quote", type: "quote" },
  { label: "Book an Appointment", type: "consultation" },
  { label: "Property Enquiry", type: "property" },
  { label: "Land Enquiry", type: "land" },
  { label: "Building Materials", type: "sales" },
  { label: "Equipment Hire", type: "project" },
  { label: "Project Consultation", type: "project" },
  { label: "Contact Our Team", type: "sales" },
];

type Step = "menu" | "form" | "sent";

function isOpenNow(): boolean {
  const d = new Date();
  const day = d.getDay(); // 0 Sun … 6 Sat
  const mins = d.getHours() * 60 + d.getMinutes();
  if (day === 0) return false;
  if (day === 6) return mins >= 9 * 60 && mins < 14 * 60;
  return mins >= 8 * 60 && mins < 17 * 60;
}

export function SupportWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("menu");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const show =
    pathname === "/" || SHOW_ON_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open && step === "form") inputRef.current?.focus();
  }, [open, step]);

  if (!show) return null;

  function openFrom(option?: { label: string; type: RequestTypeKey }) {
    if (option) {
      setChosen(option.label);
      setStep("form");
      setMessage((m) => m || `I'd like to speak with your team about: ${option.label}`);
    } else {
      setChosen(null);
      setStep("form");
    }
    setOpen(true);
  }

  function reset() {
    setStep("menu");
    setStatus("idle");
    setError("");
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setChosen(null);
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Please add your name, email and phone so we can get back to you.");
      return;
    }
    setStatus("sending");
    setError("");
    const type: RequestTypeKey =
      (QUICK_OPTIONS.find((o) => o.label === chosen)?.type as RequestTypeKey) ?? "sales";
    const description = chosen ? `${chosen}. ${message.trim()}`.trim() : message.trim();

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestType: type,
          fullName: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          description,
          preferredContactMethod: "email",
        }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (!res.ok || !data?.ok) throw new Error("send-failed");
      setStep("sent");
      setStatus("idle");
    } catch {
      setStatus("idle");
      setStep("form");
      setError(
        "We couldn't reach our team right now. Please call us on " + COMPANY.phones[0] + ".",
      );
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          role="dialog"
          aria-label="AUTHENTIC J.A. CONSTRUCTION LTD. customer support"
          className="ajac-fade-in flex w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl bg-surface shadow-lg ring-1 ring-black/10"
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-blue-900 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-brand-gold">
              <Icon name="chat" className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-white">{COMPANY.name}</div>
              <div className="text-xs font-medium text-blue-100">Customer Support</div>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-blue-100 hover:bg-white/10 hover:text-white"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-4">
            {step === "menu" && (
              <div className="ajac-fade-in">
                <p className="text-neutral-800">
                  Welcome to <span className="font-semibold">{COMPANY.name}</span>
                </p>
                <p className="mt-1 text-sm text-neutral-600">How can we assist you today?</p>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {QUICK_OPTIONS.map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      onClick={() => openFrom(o)}
                      className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-left text-sm font-medium text-neutral-700 transition hover:border-brand-blue hover:bg-blue-50 hover:text-brand-blue"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-blue" />
                      {o.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => openFrom()}
                  className="mt-3 text-sm font-semibold text-brand-blue hover:underline"
                >
                  Or type your message…
                </button>
              </div>
            )}

            {step === "form" && (
              <form onSubmit={send} className="ajac-fade-in flex flex-col gap-3">
                {chosen && (
                  <p className="rounded-md bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-600">
                    Topic: {chosen}
                  </p>
                )}
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-neutral-700">Full name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-neutral-700">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-neutral-700">Phone</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    required
                    placeholder="e.g. +233 245 295 866"
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-neutral-700">Your message</span>
                  <textarea
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="resize-y rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                {error && (
                  <p role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <span>
                      {error}
                      {error.includes("call us") && (
                        <a href={telHref(COMPANY.phones[0])} className="ml-1 font-semibold underline">
                          {COMPANY.phones[0]}
                        </a>
                      )}
                    </span>
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {status === "sending" ? "Sending…" : "Send message"}
                    {status !== "sending" && <Icon name="send" className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-md border border-neutral-300 px-3 py-2.5 text-sm font-medium text-neutral-600 hover:border-neutral-400"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}

            {step === "sent" && (
              <div className="ajac-fade-in">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white">
                  <Icon name="check" className="h-6 w-6" />
                </span>
                <p className="mt-3 font-semibold text-neutral-900">Enquiry forwarded</p>
                <p className="mt-1 text-sm text-neutral-600">
                  Your enquiry has been forwarded to the appropriate department. Our team will
                  respond as soon as possible.
                </p>
                <p className="mt-2 text-sm text-neutral-500">
                  {isOpenNow()
                    ? "Our team is available and will respond shortly."
                    : "We've received your message and will respond during our next business hours."}
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 text-sm font-semibold text-brand-blue hover:underline"
                >
                  Send another message
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label={open ? "Close customer support" : "Start a chat with customer support"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="ajac-fade-in flex h-[58px] w-[58px] items-center justify-center rounded-full bg-brand-blue text-white shadow-lg ring-2 ring-white/60 transition hover:bg-blue-700"
      >
        {open ? <Icon name="close" className="h-7 w-7" /> : <Icon name="chat" className="h-7 w-7" />}
      </button>
    </div>
  );
}