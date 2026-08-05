"use client";

import { useState } from "react";
import { Field, Input } from "@ajac/ui";
import {
  COMPANY,
  REQUEST_TYPES,
  telHref,
  type RequestTypeKey,
} from "../config/company";
import { Icon } from "./icons";

type Status = "idle" | "submitting" | "success" | "error";

interface FormState {
  requestType: RequestTypeKey;
  fullName: string;
  company: string;
  email: string;
  phone: string;
  whatsapp: string;
  projectType: string;
  service: string;
  budgetRange: string;
  preferredLocation: string;
  description: string;
  preferredContactMethod: "phone" | "email" | "whatsapp" | "";
}

const INITIAL_STATE: FormState = {
  requestType: "quote",
  fullName: "",
  company: "",
  email: "",
  phone: "",
  whatsapp: "",
  projectType: "",
  service: "",
  budgetRange: "",
  preferredLocation: "",
  description: "",
  preferredContactMethod: "",
};

const PROJECT_TYPES = [
  "Residential",
  "Commercial",
  "Industrial",
  "Civil / Infrastructure",
  "Government",
  "Other",
];

const SERVICES = [
  "Architectural Designs",
  "Pillar Construction",
  "Sand & Stone",
  "Building Construction",
  "Civil Engineering",
  "Acquisition of Land",
  "Block Factory / Materials",
  "Plant & Equipment Hire",
];

const BUDGET_RANGES = [
  "Under GHS 50,000",
  "GHS 50,000 – 100,000",
  "GHS 100,000 – 500,000",
  "GHS 500,000 – 1,000,000",
  "GHS 1,000,000+",
  "Not sure yet",
];

const baseControl =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900 " +
  "placeholder:text-neutral-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-blue-100";

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${baseControl} appearance-none pr-9`} />;
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${baseControl} min-h-28 resize-y`} />;
}

export function RequestForm({ initialType = "quote" }: { initialType?: RequestTypeKey }) {
  const [form, setForm] = useState<FormState>({ ...INITIAL_STATE, requestType: initialType });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((e) => ({ ...e, [key]: undefined }));
    }
  };

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.requestType) next.requestType = "Choose what you need.";
    if (form.fullName.trim().length === 0) next.fullName = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    if (form.phone.trim().replace(/\D/g, "").length < 9) {
      next.phone = "Please enter a valid phone number.";
    }
    if (form.whatsapp && form.whatsapp.replace(/\D/g, "").length > 0 && form.whatsapp.replace(/\D/g, "").length < 9) {
      next.whatsapp = "Check your WhatsApp number.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    setServerError("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestType: form.requestType,
          fullName: form.fullName.trim(),
          company: form.company.trim() || undefined,
          email: form.email.trim(),
          phone: form.phone.trim(),
          whatsapp: form.whatsapp.trim() || undefined,
          projectType: form.projectType || undefined,
          service: form.service || undefined,
          budgetRange: form.budgetRange || undefined,
          preferredLocation: form.preferredLocation.trim() || undefined,
          description: form.description.trim() || undefined,
          preferredContactMethod: form.preferredContactMethod || undefined,
          attachmentName: fileName || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        reference?: string;
        error?: string;
        errors?: Record<string, string>;
      } | null;

      if (res.status === 400 && data?.errors) {
        setStatus("idle");
        setErrors(data.errors as Partial<Record<keyof FormState, string>>);
        return;
      }
      if (!data?.ok) {
        setStatus("error");
        setServerError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setReference(data.reference ?? "");
      setStatus("success");
    } catch {
      setStatus("error");
      setServerError("Our request service is temporarily unavailable. Please call us.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white">
          <Icon name="check" className="h-9 w-9" />
        </span>
        <p className="mt-5 text-2xl font-semibold text-green-900">Request received</p>
        <p className="mt-2 text-green-800">
          Thank you, {form.fullName.trim().split(" ")[0]}. Your request has been sent to our team and
          we&apos;ll contact you within one business day.
        </p>
        {reference && (
          <p className="mt-4 inline-block rounded-md bg-green-100 px-3 py-1 font-mono text-sm font-semibold text-green-800">
            Reference: {reference}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setForm({ ...INITIAL_STATE, requestType: form.requestType });
              setFileName("");
              setStatus("idle");
            }}
            className="rounded-md bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
          >
            Submit another request
          </button>
          <a href={telHref(COMPANY.phones[0])} className="text-sm font-semibold text-green-800 underline">
            or call us on {COMPANY.phones[0]}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
      <div className="grid gap-5">
        {/* Request type */}
        <Field label="What do you need?" htmlFor="requestType">
          <SelectInput
            id="requestType"
            value={form.requestType}
            onChange={(e) => set("requestType", e.target.value as RequestTypeKey)}
            aria-invalid={!!errors.requestType || undefined}
          >
            {Object.entries(REQUEST_TYPES).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </SelectInput>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name *" htmlFor="fullName" error={errors.fullName}>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="e.g. Ama Mensah"
              invalid={!!errors.fullName}
              autoComplete="name"
            />
          </Field>
          <Field label="Company (optional)" htmlFor="company">
            <Input
              id="company"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="Company or organisation"
              autoComplete="organization"
            />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
              invalid={!!errors.email}
              autoComplete="email"
            />
          </Field>
          <Field label="Phone number" htmlFor="phone" error={errors.phone}>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="0245 000 000"
              invalid={!!errors.phone}
              autoComplete="tel"
            />
          </Field>
          <Field label="WhatsApp (optional)" htmlFor="whatsapp" error={errors.whatsapp}>
            <Input
              id="whatsapp"
              type="tel"
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="0245 000 000"
              invalid={!!errors.whatsapp}
            />
          </Field>
        </div>

        <div className="grid gap-5 border-t border-neutral-100 pt-5 sm:grid-cols-2">
          <Field label="Project type" htmlFor="projectType">
            <SelectInput
              id="projectType"
              value={form.projectType}
              onChange={(e) => set("projectType", e.target.value)}
            >
              <option value="">Select a project type…</option>
              {PROJECT_TYPES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Service required" htmlFor="service">
            <SelectInput id="service" value={form.service} onChange={(e) => set("service", e.target.value)}>
              <option value="">Select a service…</option>
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Budget range" htmlFor="budgetRange">
            <SelectInput
              id="budgetRange"
              value={form.budgetRange}
              onChange={(e) => set("budgetRange", e.target.value)}
            >
              <option value="">Select a budget range…</option>
              {BUDGET_RANGES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Preferred location" htmlFor="preferredLocation">
            <Input
              id="preferredLocation"
              value={form.preferredLocation}
              onChange={(e) => set("preferredLocation", e.target.value)}
              placeholder="Town / city / district"
            />
          </Field>
        </div>

        <div className="grid gap-5 border-t border-neutral-100 pt-5">
          <Field label="Project description" htmlFor="description">
            <TextArea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Tell us about your project, site or requirement…"
            />
          </Field>

          <Field
            label="Attach files"
            htmlFor="attachment"
            hint="Plans, drawings, BOQ, site photos (PDF, images, docs — up to 10MB). Your file name is recorded with your request."
          >
            <label
              htmlFor="attachment"
              className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-600 hover:border-brand-blue hover:bg-blue-50"
            >
              <Icon name="upload" className="h-5 w-5 shrink-0 text-brand-blue" />
              <span className="truncate">{fileName ? `Attached: ${fileName}` : "Choose a file…"}</span>
              <input
                id="attachment"
                type="file"
                className="sr-only"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    setFileName("");
                    return;
                  }
                  if (file.size > 10 * 1024 * 1024) {
                    setServerError("That file is over 10MB. Please choose a smaller file.");
                    setFileName("");
                    e.target.value = "";
                    return;
                  }
                  setServerError("");
                  setFileName(file.name);
                }}
              />
            </label>
          </Field>
        </div>

        <div className="grid gap-3 border-t border-neutral-100 pt-5">
          <Field label="Preferred contact method" htmlFor="preferredContactMethod-phone" srOnly>
            <div className="flex flex-wrap gap-3" role="group" aria-label="Preferred contact method">
              {(["phone", "email", "whatsapp"] as const).map((method) => (
                <label
                  key={method}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 has-[:checked]:border-brand-blue has-[:checked]:bg-blue-50 has-[:checked]:text-brand-blue"
                >
                  <input
                    type="radio"
                    name="preferredContactMethod"
                    value={method}
                    checked={form.preferredContactMethod === method}
                    onChange={() => set("preferredContactMethod", method)}
                    className="h-4 w-4 accent-brand-blue"
                  />
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </label>
              ))}
            </div>
          </Field>
        </div>

        {serverError && (
          <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              {serverError}
              <a href={telHref(COMPANY.phones[0])} className="ml-1 font-semibold underline">
                Call {COMPANY.phones[0]}
              </a>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-blue px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? "Submitting…" : "Submit request"}
          {status !== "submitting" && <Icon name="send" className="h-4 w-4" />}
        </button>
      </div>
    </form>
  );
}

/** Re-export typing so callers can pass a request type from a CTA. */
export type { RequestTypeKey };