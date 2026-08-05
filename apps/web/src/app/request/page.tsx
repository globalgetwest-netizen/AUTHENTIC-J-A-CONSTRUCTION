import { Container, Heading, Kicker, Text } from "@ajac/ui";
import Link from "next/link";
import { RequestForm } from "../../components/RequestForm";
import { COMPANY, REQUEST_TYPES, telHref, type RequestTypeKey } from "../../config/company";

const VALID_TYPES = new Set<string>(Object.keys(REQUEST_TYPES));

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.type) ? params.type[0] : params.type;
  const initialType: RequestTypeKey = raw && VALID_TYPES.has(raw) ? (raw as RequestTypeKey) : "quote";

  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1">
        <section className="bg-blue-900 text-white">
          <Container>
            <div className="py-14 md:py-16">
              <Kicker color="rgba(255,215,0,0.95)">{COMPANY.name}</Kicker>
              <Heading level={1} color="surface">
                {REQUEST_TYPES[initialType].label}
              </Heading>
              <Text color="surface" size="lg" className="max-w-2xl">
                Tell us what you need and our team will respond with a clear, structured response —
                usually within one business day.
              </Text>
            </div>
          </Container>
        </section>

        <section className="bg-neutral-50 py-14">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
              <RequestForm initialType={initialType} />

              <aside className="space-y-6">
                <div className="rounded-xl bg-surface p-6 ring-1 ring-black/5">
                  <Text weight="semibold">Prefer to talk?</Text>
                  <ul className="mt-3 flex flex-col gap-2 text-sm text-neutral-700">
                    {COMPANY.phones.map((p, i) => (
                      <li key={p}>
                        <a href={telHref(p)} className="font-medium text-brand-blue hover:underline">
                          {p} <span className="font-normal text-neutral-500">({COMPANY.phoneLabels[i]})</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`mailto:${COMPANY.email}`}
                    className="mt-3 block text-sm font-medium text-brand-blue hover:underline"
                  >
                    {COMPANY.email}
                  </a>
                </div>

                <div className="rounded-xl bg-blue-900 p-6 text-white">
                  <Text weight="semibold" className="text-brand-gold">
                    What happens next?
                  </Text>
                  <ol className="mt-3 flex flex-col gap-2 text-sm text-blue-100">
                    <li>1. We receive and log your request.</li>
                    <li>2. The right team reviews the details.</li>
                    <li>3. We contact you with a response or quote.</li>
                  </ol>
                </div>

                <div className="rounded-xl bg-surface p-6 ring-1 ring-black/5">
                  <Text weight="semibold">Offices</Text>
                  <p className="mt-3 text-sm text-neutral-700">
                    <span className="font-semibold text-neutral-900">Head Office —</span> {COMPANY.headOffice}
                  </p>
                  <p className="mt-2 text-sm text-neutral-700">
                    <span className="font-semibold text-neutral-900">Registered Business Address —</span> {COMPANY.registeredAddress}
                  </p>
                  <Link href="/#services" className="mt-4 inline-block text-sm font-semibold text-brand-blue hover:underline">
                    View our services &rarr;
                  </Link>
                </div>
              </aside>
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}