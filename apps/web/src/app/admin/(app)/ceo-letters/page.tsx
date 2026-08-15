"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@ajac/ui";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

/**
 * Compose an official CEO & Founder letter. The letter is free-form text (not a
 * backend record), so the form POSTs the composed letter to the PDF route and
 * downloads the rendered letterhead PDF.
 */
export default function CeoLetterComposePage() {
  const [refNo, setRefNo] = useState("AJA/CEO/2026/");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [recipient, setRecipient] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [salutation, setSalutation] = useState("Dear Sir/Madam,");
  const [subject, setSubject] = useState("");
  const [paragraphs, setParagraphs] = useState([""]);
  const [includeStamp, setIncludeStamp] = useState(true);
  const [includeSignature, setIncludeSignature] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function updateParagraph(index: number, value: string) {
    setParagraphs((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  function addParagraph() {
    setParagraphs((prev) => [...prev, ""]);
  }

  function removeParagraph(index: number) {
    setParagraphs((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!refNo.trim()) return setError("Reference number is required.");
    if (!recipient.trim()) return setError("Recipient is required.");
    if (!subject.trim()) return setError("Subject is required.");
    const bodyText = paragraphs.map((p) => p.trim()).filter(Boolean);
    if (!bodyText.length) return setError("Write at least one body paragraph.");

    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ceo-letters", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          refNo: refNo.trim(),
          date: new Date(date).toISOString(),
          recipient: recipient.trim(),
          recipientAddress: recipientAddress.trim() || undefined,
          salutation: salutation.trim() || undefined,
          subject: subject.trim(),
          paragraphs: bodyText,
          includeStamp,
          includeSignature,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? "Could not generate the letter.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${refNo.trim()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate the letter.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/admin/corporate-documents"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to corporate documents
      </Link>
      <div>
        <h1 className="text-xl font-bold text-neutral-900">CEO & Founder letter</h1>
        <p className="text-sm text-neutral-500">
          Official executive correspondence on the CEO letterhead, signed and dated. Download the
          letter as a PDF.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="cl-ref">
              Reference number *
            </label>
            <input
              id="cl-ref"
              className={inputClass}
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
              placeholder="AJA/CEO/2026/000"
              maxLength={60}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="cl-date">
              Date *
            </label>
            <input
              id="cl-date"
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="cl-recipient">
            Recipient *
          </label>
          <input
            id="cl-recipient"
            className={inputClass}
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="e.g. The Board of Directors"
            maxLength={200}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="cl-address">
            Recipient address
          </label>
          <textarea
            id="cl-address"
            className={inputClass}
            rows={2}
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="Company / postal address shown under the recipient name"
            maxLength={500}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="cl-salutation">
            Salutation
          </label>
          <input
            id="cl-salutation"
            className={inputClass}
            value={salutation}
            onChange={(e) => setSalutation(e.target.value)}
            placeholder="Dear Sir/Madam,"
            maxLength={100}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="cl-subject">
            Subject *
          </label>
          <input
            id="cl-subject"
            className={inputClass}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="RE: …"
            maxLength={300}
          />
        </div>

        <div>
          <span className={labelClass}>Body paragraphs *</span>
          <div className="mt-1 space-y-3">
            {paragraphs.map((p, i) => (
              <div key={i} className="flex items-start gap-2">
                <textarea
                  className={inputClass}
                  rows={3}
                  value={p}
                  onChange={(e) => updateParagraph(i, e.target.value)}
                  placeholder={`Paragraph ${i + 1}`}
                />
                {paragraphs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeParagraph(i)}
                    className="mt-1 shrink-0 rounded-md border border-neutral-300 px-2 py-1 text-xs font-semibold text-neutral-500 transition hover:border-red-300 hover:text-red-700"
                    aria-label={`Remove paragraph ${i + 1}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addParagraph}
            className="mt-2 text-sm font-semibold text-brand-blue hover:underline"
          >
            + Add paragraph
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="cl-signature">
              Include CEO signature
            </label>
            <input
              id="cl-signature"
              type="checkbox"
              checked={includeSignature}
              onChange={(e) => setIncludeSignature(e.target.checked)}
              className="h-4 w-4 text-brand-blue focus:ring-brand-blue border-neutral-300 rounded"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="cl-stamp">
              Include CEO stamp/seal
            </label>
            <input
              id="cl-stamp"
              type="checkbox"
              checked={includeStamp}
              onChange={(e) => setIncludeStamp(e.target.checked)}
              className="h-4 w-4 text-brand-blue focus:ring-brand-blue border-neutral-300 rounded"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={busy}>
            Download PDF
          </Button>
          <Link
            href="/admin/corporate-documents"
            className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
