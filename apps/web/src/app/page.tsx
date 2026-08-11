import {
  Badge,
  ButtonLink,
  Card,
  Container,
  Divider,
  Heading,
  Kicker,
  Stack,
  Text,
} from "@ajac/ui";
import Link from "next/link";
import { Icon, type IconName } from "../components/icons";
import { BrandLogo } from "../components/BrandLogo";
import { Logo } from "../components/Logo";
import { MobileNav } from "../components/MobileNav";
import { PhotoBlock } from "../components/PhotoBlock";
import {
  COMPANY,
  COMPANY_IMAGES,
  DEPARTMENT_EMAILS,
  LEADERSHIP,
  REQUEST_TYPES,
  SOCIAL_MEDIA,
  telHref,
  whatsappHref,
  type RequestTypeKey,
} from "../config/company";

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

type QuickAction = { type: RequestTypeKey; icon: IconName };

const QUICK_ACTIONS: QuickAction[] = [
  { type: "quote", icon: "send" },
  { type: "project", icon: "pillar" },
  { type: "site-inspection", icon: "pin" },
  { type: "property", icon: "building" },
  { type: "land", icon: "land" },
  { type: "sales", icon: "phone" },
];

const NAV = [
  { href: "/", label: "Home" },
  { href: "#overview", label: "Company" },
  { href: "#services", label: "Services" },
  { href: "#projects", label: "Projects" },
  { href: "#realestate", label: "Real Estate" },
  { href: "#materials", label: "Materials" },
  { href: "#contact", label: "Contact" },
];

const DIVISIONS = [
  {
    name: "Construction & Civil Engineering",
    blurb: "Residential, commercial and industrial works, roads and infrastructure delivered to spec.",
    link: "#services",
    accent: "bg-blue-600",
    eyebrow: "Built to last",
  },
  {
    name: "Real Estate & Property Development",
    blurb: "Commercial and residential developments, sales and rentals designed to endure.",
    link: "#realestate",
    accent: "bg-green-600",
    eyebrow: "Places to grow",
  },
  {
    name: "Land Allocation & Development",
    blurb: "Structured land acquisition, servicing, title support and resale.",
    link: "#land",
    accent: "bg-yellow-500",
    eyebrow: "Secure foundations",
  },
  {
    name: "Building Materials & Block Factory",
    blurb: "Factory-grade blocks and materials supplied at scale for contractors and homeowners.",
    link: "#materials",
    accent: "bg-red-500",
    eyebrow: "Supply at scale",
  },
];

const SERVICE_ICONS: { name: string; icon: IconName; blurb: string }[] = [
  { name: "Architectural Designs", icon: "architectural", blurb: "Drawings, plans and design support." },
  { name: "Pillar Construction", icon: "pillar", blurb: "Structural columns, frames and foundations." },
  { name: "Sand & Stone", icon: "sandstone", blurb: "Quarry products, sand and stone supply." },
  { name: "Building Construction", icon: "building", blurb: "Residential and commercial building works." },
  { name: "Civil Engineering", icon: "civil", blurb: "Roads, drainage and infrastructure." },
  { name: "Acquisition of Land", icon: "land", blurb: "Secure land acquisition and site servicing." },
];

const SERVICE_LINES = [
  { group: "Construction", accent: "bg-blue-600", items: ["Residential", "Commercial", "Industrial", "Civil / Infrastructure", "Government"] },
  { group: "Real Estate", accent: "bg-green-600", items: ["Property Development", "Houses for Sale", "Houses for Rent", "Estate Development", "Property Investment"] },
  { group: "Land", accent: "bg-yellow-500", items: ["Land Allocation", "Land Development", "Site Servicing", "Acquisition"] },
  { group: "Building Materials", accent: "bg-red-500", items: ["Block Factory", "Cement Products", "Sand & Stone", "Construction Materials"] },
];

const PLANT = [
  { name: "Tippers", detail: "Sand, gravel & material haulage" },
  { name: "Excavators", detail: "Earthworks, drainage & excavation" },
  { name: "Wheel Loaders", detail: "Loading & site levelling" },
  { name: "Heavy Equipment (C.A.T.)", detail: "Rigorous-duty earthmoving" },
];

const MATERIALS = [
  "Quarry Stones & Chips",
  "Gravel",
  "Foundation Sand",
  "Quarry Dust",
  "Cement & Binders",
  "Factory-Made Blocks",
];

/** Card labels for the MATERIALS product gallery, aligned to `COMPANY_IMAGES.materialsGallery`. */
const MATERIAL_GALLERY_LABELS = [
  "Quarry Stones & Chips",
  "Foundation Sand",
  "Cement & Binders",
  "Gravel",
  "Quarry Dust",
  "Factory-Made Blocks",
];

const WHY_CHOOSE_US = [
  "Vertically integrated — land, materials and construction under one group.",
  "Own block factory and in-house plant & equipment.",
  "Registered with the Government of Ghana.",
  "Experienced operators on every hire and project.",
];

const PROPERTY_CAPABILITIES = [
  "Property Development",
  "Houses for Sale & Rent",
  "Estate Development",
  "Land Allocation & Site Servicing",
  "Property Investment Support",
];

const PILLAR_TIERS = [
  {
    name: "Futuristic Designs",
    detail: "8 statement designs with built-in LED lighting",
    accent: "bg-blue-600",
  },
  {
    name: "Premium Modern",
    detail: "8 refined designs with wall-sconce detailing",
    accent: "bg-green-600",
  },
  {
    name: "Elegant & Bold Colors",
    detail: "8 bold finishes — blue, gold, green, purple & white",
    accent: "bg-yellow-500",
  },
];

const PILLAR_FEATURES = [
  "High Quality Concrete",
  "Durable & Weather Resistant",
  "Modern & Futuristic Finish",
  "Perfect for Homes & Commercial Projects",
  "Custom Sizes & Colors Available",
];

const FOOTER_COLS: { title: string; rows: { label: string; href?: string }[] }[] = [
  {
    title: "Company",
    rows: [
      { label: "About Us", href: "#overview" },
      { label: "Careers", href: "#contact" },
      { label: "News", href: "#quote" },
    ],
  },
  {
    title: "Services",
    rows: [
      { label: "Construction", href: "#services" },
      { label: "Real Estate", href: "#realestate" },
      { label: "Land", href: "#land" },
      { label: "Materials", href: "#materials" },
    ],
  },
  {
    title: "Projects",
    rows: [
      { label: "Residential", href: "#projects" },
      { label: "Commercial", href: "#projects" },
      { label: "Government", href: "#projects" },
      { label: "Infrastructure", href: "#projects" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Home                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Utility bar */}
      <div className="bg-neutral-900 text-neutral-300">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-xs">
            <div className="flex items-center gap-4">
              <a href={telHref(COMPANY.phones[0])} className="hover:text-brand-gold">
                <Icon name="phone" className="mr-1 inline-block h-3 w-3 align-[-2px]" />
                {COMPANY.phones[0]} ({COMPANY.phoneLabels[0]})
              </a>
              <span aria-hidden className="text-neutral-600">·</span>
              <a href={`mailto:${COMPANY.email}`} className="hidden text-neutral-300 hover:text-brand-gold sm:inline">
                {COMPANY.email}
              </a>
            </div>
            <div className="text-neutral-400">
              Head Office — {COMPANY.headOffice} · Registered Address — {COMPANY.registeredAddress}
            </div>
          </div>
        </Container>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-surface/90 backdrop-blur">
        <Container>
          <div className="flex items-center justify-between gap-6 py-3">
            <Link href="/" className="flex items-center gap-3">
              <Logo width={80} src="/app-icon.png" />
              <span className="leading-tight">
                <span className="block text-sm font-bold tracking-wide text-neutral-900">{COMPANY.shortName}</span>
                <span className="block text-[11px] font-semibold tracking-[0.22em] text-neutral-600">
                  CONSTRUCTION LIMITED
                </span>
              </span>
            </Link>

            <nav aria-label="Primary" className="hidden items-center gap-6 text-sm font-medium text-neutral-700 lg:flex">
              {NAV.map((l) => (
                <Link key={l.label} href={l.href} className="transition hover:text-brand-blue">
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="hidden flex-col items-end gap-1 lg:flex">
              <ButtonLink href="/request?type=quote" size="sm">
                Request a Quote
              </ButtonLink>
              <span className="text-[10px] font-medium tracking-[0.04em] text-neutral-500">
                Reg. No. {COMPANY.registrationNo} · TIN {COMPANY.taxId}
              </span>
            </div>

            <div className="lg:hidden">
              <MobileNav
                links={NAV}
                actions={[
                  { href: "/request?type=consultation", label: "Book an Appointment" },
                  { href: "/request?type=quote", label: "Request a Quote" },
                ]}
              />
            </div>
          </div>
        </Container>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-blue-900 text-white">
          {COMPANY_IMAGES.hero.src && (
            <div
              aria-hidden
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${COMPANY_IMAGES.hero.src})` }}
            />
          )}
          <Container>
            <div className="py-16 md:py-24">
              <Stack gap={6} wrap={false} align="flex-start" className="max-w-3xl">
                <Kicker color="rgba(255,215,0,0.95)" className="[text-shadow:0_1px_10px_rgba(9,20,38,0.55)]">
                  Construction · Engineering · Real Estate · Materials
                </Kicker>
                <Heading
                  level={1}
                  color="surface"
                  size="5xl"
                  className="[text-shadow:0_2px_18px_rgba(9,20,38,0.7)]"
                >
                  Building Ghana&apos;s Future Through Construction, Engineering &amp; Property Development
                </Heading>
                <Text
                  size="lg"
                  color="surface"
                  weight="semibold"
                  className="font-display italic text-blue-100 [text-shadow:0_1px_12px_rgba(9,20,38,0.6)]"
                >
                  Authentic: Quality Structures. Trusted Solutions.
                </Text>
                <Stack direction="row" gap={3} wrap>
                  <ButtonLink href="/request?type=quote" size="lg" variant="secondary">
                    Request a Quote
                  </ButtonLink>
                  <ButtonLink
                    href="/#services"
                    size="lg"
                    variant="outline"
                    style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.5)" }}
                  >
                    Our Services
                  </ButtonLink>
                  <ButtonLink
                    href="/request?type=consultation"
                    size="lg"
                    variant="outline"
                    style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.5)" }}
                  >
                    Book an Appointment
                  </ButtonLink>
                </Stack>
              </Stack>
            </div>
          </Container>
        </section>

        {/* Quick actions */}
        <section className="border-b border-neutral-200 bg-neutral-50">
          <Container>
            <ul className="grid grid-cols-2 gap-px bg-neutral-200 sm:grid-cols-3 lg:grid-cols-6">
              {QUICK_ACTIONS.map((a) => (
                <li key={a.type} className="flex">
                  <Link
                    href={`/request?type=${a.type}`}
                    className="flex w-full items-center gap-3 bg-neutral-50 px-4 py-4 text-sm font-semibold text-neutral-800 transition hover:bg-white hover:text-brand-blue"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-600/10 text-brand-blue">
                      <Icon name={a.icon} className="h-5 w-5" />
                    </span>
                    {REQUEST_TYPES[a.type].label}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {/* Overview */}
        <section id="overview" className="scroll-mt-24 bg-white py-20">
          <Container>
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <Stack wrap={false} align="flex-start" gap={4}>
                <Kicker>Who we are</Kicker>
                <Heading level={2}>A vertically-integrated construction &amp; property group</Heading>
                <Text color="muted" size="lg">
                  {COMPANY.name} is a Ghana-registered group spanning construction and civil engineering,
                  real estate and property development, land allocation, and building-materials
                  manufacturing. Registered in {COMPANY.registeredAddress} and operating from our head
                  office in {COMPANY.headOffice}, we control the chain from raw materials to finished
                  structures.
                </Text>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Badge tone="brand" soft>Vertically integrated</Badge>
                  <Badge tone="success" soft>Construction · Property · Materials</Badge>
                  <Badge tone="info" soft>Land allocation &amp; development</Badge>
                  <Badge tone="warning" soft>Registered with the Government of Ghana</Badge>
                </div>
              </Stack>
              <div className="rounded-xl bg-neutral-100 p-8">
                <Text weight="semibold" color="muted">Our commitment</Text>
                <Text className="mt-3 text-2xl font-semibold leading-snug text-neutral-900">
                  &ldquo;Quality Structures. Trusted Solutions.&rdquo; — delivered with integrity at every
                  level, from a single land sale to a full government project.
                </Text>
              </div>
            </div>
          </Container>
        </section>

        {/* Divisions */}
        <section id="divisions" className="scroll-mt-24 bg-neutral-50 py-20">
          <Container>
            <Stack wrap={false} gap={3}>
              <Kicker>What we do</Kicker>
              <Heading level={2}>Our Business Divisions</Heading>
              <Text color="muted">Four integrated divisions working as one group, to one standard.</Text>
            </Stack>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {DIVISIONS.map((d) => (
                <Card key={d.name} interactive className="overflow-hidden">
                  <div className={`h-1.5 w-full ${d.accent}`} />
                  <Stack wrap={false} gap={3} align="flex-start" className="px-6 py-6">
                    <Text size="xs" weight="semibold" color="muted" className="uppercase tracking-[0.18em]">
                      {d.eyebrow}
                    </Text>
                    <Text weight="semibold">{d.name}</Text>
                    <Text size="sm" color="muted">{d.blurb}</Text>
                    <Link href={d.link} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:text-blue-800">
                      Learn More <span aria-hidden>&rarr;</span>
                    </Link>
                  </Stack>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* Core services — six real services as icon cards */}
        <section id="services" className="scroll-mt-24 bg-white py-20">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <Stack wrap={false} gap={3}>
                <Kicker>Core services</Kicker>
                <Heading level={2}>Everything from the block to the building</Heading>
                <Text color="muted">Our six core services, delivered to a single standard.</Text>
              </Stack>
              <ButtonLink href="/request?type=quote" size="sm" variant="outline">
                Get a quote
              </ButtonLink>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICE_ICONS.map((s) => (
                <Card key={s.name} className="p-6">
                  <Stack wrap={false} gap={3} align="flex-start">
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/10 text-brand-blue">
                      <Icon name={s.icon} className="h-6 w-6" />
                    </span>
                    <Text weight="semibold" className="text-lg">{s.name}</Text>
                    <Text size="sm" color="muted">{s.blurb}</Text>
                    <Link href={`/request?type=quote`} className="mt-1 text-sm font-semibold text-brand-blue hover:text-blue-800">
                      Request a quote &rarr;
                    </Link>
                  </Stack>
                </Card>
              ))}
            </div>

            <div className="mt-14 grid items-center gap-8 rounded-2xl bg-neutral-50 p-8 ring-1 ring-black/5 lg:grid-cols-2">
              <PhotoBlock
                image={COMPANY_IMAGES.architecturalDesigns}
                icon="architectural"
                label="Architectural Designs"
                className="min-h-56"
              />
              <Stack wrap={false} align="flex-start" gap={3}>
                <Kicker>Architectural designs</Kicker>
                <Heading level={3}>From concept drawings to construction-ready plans</Heading>
                <Text size="sm" color="muted">
                  Our design desk produces drawings, plans and structural detailing to support your
                  project from first sketch to approved build.
                </Text>
                <ButtonLink href="/request?type=quote" size="sm">Request a design</ButtonLink>
              </Stack>
            </div>

            <div id="projects" className="mt-14 scroll-mt-24">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {SERVICE_LINES.map((g) => (
                  <div key={g.group} className="rounded-xl bg-neutral-50 p-6 ring-1 ring-black/5">
                    <span aria-hidden className={`mb-4 inline-block h-1 w-10 rounded-full ${g.accent}`} />
                    <Text weight="semibold" className="text-lg">{g.group}</Text>
                    <ul className="mt-3 flex flex-col gap-2">
                      {g.items.map((it) => (
                        <li key={it} className="flex items-start gap-2 text-sm text-neutral-700">
                          <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300" />
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Real estate */}
        <section id="realestate" className="scroll-mt-24 bg-neutral-50 py-20">
          <Container>
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <Stack wrap={false} align="flex-start" gap={4}>
                <Kicker>Real estate &amp; property</Kicker>
                <Heading level={2}>Developments, sales, rentals &amp; land</Heading>
                <Text color="muted" size="lg">
                  From residential houses for sale and rent to commercial and estate development, our
                  property division pairs structured land allocation with responsibly built homes.
                </Text>
                <Stack direction="row" gap={3} wrap>
                  <ButtonLink href="/request?type=property" size="sm" variant="outline">Request property information</ButtonLink>
                  <ButtonLink href="/request?type=land" size="sm" variant="ghost">Request land information</ButtonLink>
                </Stack>
              </Stack>
              <div id="land" className="grid scroll-mt-24 gap-4">
                {PROPERTY_CAPABILITIES.map((item, i) => (
                  <div key={item} className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Text weight="medium">{item}</Text>
                  </div>
                ))}
                <PhotoBlock
                  image={COMPANY_IMAGES.land}
                  icon="land"
                  label="Plots of Land for Allocation"
                  className="min-h-48"
                />
              </div>
            </div>
          </Container>
        </section>

        {/* Materials & block factory */}
        <section id="materials" className="scroll-mt-24 bg-white py-20">
          <Container>
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="order-2 flex flex-col gap-6 lg:order-1">
                <PhotoBlock image={COMPANY_IMAGES.materials} icon="sandstone" label="Materials & Block Factory" className="min-h-64" />
                <div className="grid grid-cols-2 gap-3">
                  {MATERIALS.map((m) => (
                    <div key={m} className="flex items-center gap-2 rounded-lg bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-800">
                      <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                      {m}
                    </div>
                  ))}
                </div>
              </div>
              <Stack wrap={false} align="flex-start" gap={4} className="order-1 lg:order-2">
                <Kicker>Materials &amp; block factory</Kicker>
                <Heading level={2}>Materials our own factories produce and supply</Heading>
                <Text color="muted" size="lg">
                  Our block factory and materials division supplies contractors, developers and homeowners
                  at scale — factory-made blocks, quarry products, sand, gravel and cement.
                </Text>
                <Stack direction="row" gap={3} wrap>
                  <ButtonLink href="/request?type=sales" size="sm">Order materials</ButtonLink>
                  <ButtonLink href="/request?type=quote" size="sm" variant="ghost">Request a quote</ButtonLink>
                </Stack>
              </Stack>
            </div>

            <div className="mt-14">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <Stack wrap={false} gap={3}>
                  <Kicker>Materials gallery</Kicker>
                  <Heading level={3}>What we produce and supply</Heading>
                  <Text color="muted">Real products from our quarry and block factory.</Text>
                </Stack>
                <ButtonLink href="/request?type=sales" size="sm" variant="outline">Order materials</ButtonLink>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {COMPANY_IMAGES.materialsGallery.map((img, i) => (
                  <PhotoBlock
                    key={img.src}
                    image={img}
                    icon="sandstone"
                    label={MATERIAL_GALLERY_LABELS[i]}
                    className="min-h-48"
                  />
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Ready-made pillars */}
        <section id="pillars" className="scroll-mt-24 bg-neutral-50 py-20">
          <Container>
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="flex flex-col gap-5">
                <PhotoBlock
                  image={COMPANY_IMAGES.pillars.construction}
                  icon="pillar"
                  label="Ready-Made Pillar Construction"
                  className="min-h-64"
                />
                <div className="grid grid-cols-2 gap-3">
                  {PILLAR_FEATURES.map((f) => (
                    <div key={f} className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-medium text-neutral-800 ring-1 ring-black/5">
                      <Icon name="check" className="h-4 w-4 shrink-0 text-green-600" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
              <Stack wrap={false} align="flex-start" gap={4}>
                <Kicker>Ready-made pillars</Kicker>
                <Heading level={2}>Pre-cast concrete pillars, made to order</Heading>
                <Text color="muted" size="lg">
                  Our block factory pre-casts concrete pillars in a wide range of designs, sizes and
                  colours — delivered and installed for homes, commercial buildings and estate fences.
                </Text>
                <ul className="flex flex-col gap-2">
                  {PILLAR_TIERS.map((t) => (
                    <li key={t.name} className="flex items-center gap-3 rounded-lg bg-white p-4 ring-1 ring-black/5">
                      <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${t.accent}`} />
                      <div>
                        <Text weight="semibold" className="text-sm">{t.name}</Text>
                        <Text size="xs" color="muted">{t.detail}</Text>
                      </div>
                    </li>
                  ))}
                </ul>
                <Stack direction="row" gap={3} wrap>
                  <ButtonLink href="/request?type=sales" size="sm">Order ready-made pillars</ButtonLink>
                  <ButtonLink href="/request?type=quote" size="sm" variant="ghost">Request a quote</ButtonLink>
                </Stack>
              </Stack>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <PhotoBlock image={COMPANY_IMAGES.pillars.catalog} icon="pillar" label="Standard Designs" className="min-h-72" />
              <PhotoBlock image={COMPANY_IMAGES.pillars.premium} icon="architectural" label="Premium Designs" className="min-h-72" />
            </div>
          </Container>
        </section>

        {/* Plant & heavy equipment */}
        <section id="equipment" className="scroll-mt-24 bg-neutral-950 py-20 text-white">
          <Container>
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <Stack wrap={false} align="flex-start" gap={4}>
                <Kicker color="rgba(255,215,0,0.95)">Plant &amp; heavy equipment</Kicker>
                <Heading level={2} color="white">Machinery for hire, run by our operators</Heading>
                <Text color="white" size="lg">
                  Fully maintained plant and equipment available for hire to contractors and developers —
                  supplied with experienced operators, ready for any site.
                </Text>
                <ButtonLink
                  href="/request?type=project"
                  size="sm"
                  variant="outline"
                  style={{ color: "#fff", borderColor: "rgba(255,255,255,0.6)" }}
                >
                  Enquire about plant hire
                </ButtonLink>
              </Stack>
              <div className="flex flex-col gap-5">
                <PhotoBlock image={COMPANY_IMAGES.equipment} icon="civil" label="Plant & Heavy Equipment" className="min-h-56" />
                <div className="grid gap-4 sm:grid-cols-2">
                  {PLANT.map((p) => (
                    <div key={p.name} className="rounded-lg bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur">
                      <p className="text-sm font-semibold text-brand-gold">{p.name}</p>
                      <p className="mt-1 text-sm text-neutral-300">{p.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* On-site gallery */}
        <section id="fleet" className="scroll-mt-24 bg-white py-20">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <Stack wrap={false} gap={3}>
                <Kicker>On site</Kicker>
                <Heading level={2}>Our plant at work</Heading>
                <Text color="muted">A look at our tipper fleet and loading equipment on the job.</Text>
              </Stack>
              <ButtonLink href="/request?type=project" size="sm" variant="outline">Enquire about plant hire</ButtonLink>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {COMPANY_IMAGES.fleet.map((img, i) => (
                <PhotoBlock key={img.src} image={img} icon={i === 0 ? "civil" : "sandstone"} className="min-h-80" />
              ))}
            </div>
          </Container>
        </section>

        {/* Why choose us */}
        <section id="why" className="scroll-mt-24 bg-neutral-50 py-20">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <Kicker>Why choose us</Kicker>
              <Heading level={2}>One group. One standard. End to end.</Heading>
            </div>
            <ul className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
              {WHY_CHOOSE_US.map((w) => (
                <li key={w} className="flex items-start gap-3 rounded-xl bg-white p-5 text-neutral-800 ring-1 ring-black/5">
                  <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  <Text>{w}</Text>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {/* Request a quote CTA */}
        <section id="quote" className="scroll-mt-24 bg-neutral-100 py-20">
          <Container>
            <div className="flex flex-col items-center gap-6 text-center">
              <Heading level={2}>Request a Quote</Heading>
              <Text color="muted" size="lg" className="max-w-2xl">
                Tell us about your project — construction, property, land or materials — and our team will
                respond with a clear, structured quote.
              </Text>
              <Stack direction="row" gap={3} wrap justify="center">
                <ButtonLink href="/request?type=quote" size="lg">Get in touch</ButtonLink>
                <ButtonLink href={telHref(COMPANY.phones[0])} size="lg" variant="outline">
                  Call {COMPANY.phones[0]}
                </ButtonLink>
              </Stack>
            </div>
          </Container>
        </section>

        {/* Contact */}
        <section id="contact" className="scroll-mt-24 bg-white py-20">
          <Container>
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <PhotoBlock
                image={COMPANY_IMAGES.construction}
                icon="building"
                label="Construction & Civil Engineering"
                className="min-h-72"
              />

              <div>
                <Kicker>Contact us</Kicker>
                <Heading level={2} className="mt-3">Talk to our team</Heading>
                <Text color="muted" className="mt-4 max-w-md">
                  Prefer to speak directly? Call, message on WhatsApp, or email us —
                  and our team will point you to the right person.
                </Text>

                <ul className="mt-6 flex flex-col gap-3 text-sm">
                  <li className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3 ring-1 ring-black/5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-600/10 text-brand-blue">
                      <Icon name="phone" className="h-5 w-5" />
                    </span>
                    <a href={telHref(COMPANY.phones[0])} className="font-semibold text-neutral-900 hover:text-brand-blue">
                      {COMPANY.phones[0]}
                    </a>
                    <span className="ml-auto text-xs font-medium text-neutral-500">Call {COMPANY.phoneLabels[0]}</span>
                  </li>
                  <li className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3 ring-1 ring-black/5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-green-600/10 text-green-700">
                      <Icon name="whatsapp" className="h-5 w-5" />
                    </span>
                    <a href={whatsappHref(COMPANY.whatsappNumber)} target="_blank" rel="noopener noreferrer"
                       className="font-semibold text-neutral-900 hover:text-green-700">
                      {COMPANY.phones[0]}
                    </a>
                    <span className="ml-auto text-xs font-medium text-neutral-500">WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3 ring-1 ring-black/5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-600/10 text-brand-blue">
                      <Icon name="mail" className="h-5 w-5" />
                    </span>
                    <a href={`mailto:${COMPANY.email}`} className="font-semibold text-neutral-900 hover:text-brand-blue">
                      {COMPANY.email}
                    </a>
                  </li>
                </ul>

                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-600">
                  <span><span className="font-semibold text-neutral-900">Head Office:</span> {COMPANY.headOffice}</span>
                  <span><span className="font-semibold text-neutral-900">Registered:</span> {COMPANY.registeredAddress}</span>
                </div>

                <Stack direction="row" gap={3} wrap className="mt-6">
                  <ButtonLink href="/request?type=consultation" size="sm">Book an Appointment</ButtonLink>
                  <ButtonLink href="/request?type=quote" size="sm" variant="outline">Request a Quote</ButtonLink>
                </Stack>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <Divider />

      {/* Corporate footer */}
      <footer className="bg-neutral-900 text-neutral-300">
        <Container>
          <div className="grid gap-x-10 gap-y-12 py-16 lg:grid-cols-6">
            {/* Brand + follow us */}
            <div>
              <div className="flex items-center gap-3">
                <Logo width={48} inverted src="/app-icon.png" />
                <span className="leading-tight">
                  <span className="block text-sm font-semibold tracking-wide text-white">{COMPANY.shortName}</span>
                  <span className="block text-[10px] font-medium tracking-[0.2em] text-neutral-500">
                    CONSTRUCTION LIMITED
                  </span>
                </span>
              </div>
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-neutral-500">{COMPANY.motto}</p>

              <div className="mt-6">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Office hours</div>
                <ul className="mt-3 flex flex-col gap-2 text-xs text-neutral-400">
                  {COMPANY.officeHours.map((h) => (
                    <li key={h.days} className="flex gap-3">
                      <span className="min-w-0 flex-1 text-neutral-500">{h.days}</span>
                      <span className="text-right font-medium text-neutral-300">{h.hours}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Follow Us</div>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {SOCIAL_MEDIA.map((s) =>
                    !s.url ? (
                      <li key={s.platform} title={`${s.label} (not yet linked)`}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 opacity-50">
                        <BrandLogo platform={s.platform} className="h-4 w-4" />
                      </li>
                    ) : (
                      <li key={s.platform}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                           className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                          <BrandLogo platform={s.platform} className="h-4 w-4" />
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>

            {/* Link columns */}
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{col.title}</div>
                <ul className="mt-4 flex flex-col gap-2.5 text-[13px]">
                  {col.rows.map((r) => (
                    <li key={r.label}>
                      <a href={r.href} className="text-neutral-400 transition hover:text-white">{r.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Quick links + contact */}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Quick Links</div>
              <ul className="mt-4 flex flex-col gap-2.5 text-[13px]">
                {QUICK_ACTIONS.map((a) => (
                  <li key={a.type}>
                    <a href={`/request?type=${a.type}`} className="text-neutral-400 transition hover:text-white">
                      {REQUEST_TYPES[a.type].label}
                    </a>
                  </li>
                ))}
                <li className="pt-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Contact</span>
                </li>
                <li>
                  <a href={telHref(COMPANY.phones[0])} className="text-neutral-400 hover:text-white">{COMPANY.phones[0]}</a>
                </li>
                <li>
                  <a href={whatsappHref(COMPANY.whatsappNumber)} target="_blank" rel="noopener noreferrer"
                     className="text-neutral-400 hover:text-white">
                    WhatsApp — {COMPANY.phones[0]}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${COMPANY.email}`} className="text-neutral-400 hover:text-white">{COMPANY.email}</a>
                </li>
              </ul>
            </div>

            {/* Leadership + department emails */}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Leadership</div>
              <ul className="mt-4 flex flex-col gap-4 text-[13px]">
                {LEADERSHIP.map((l) => (
                  <li key={l.email}>
                    <span className="block font-medium text-neutral-100">{l.name}</span>
                    <span className="mt-0.5 block text-xs text-neutral-500">{l.title}</span>
                    <a href={`mailto:${l.email}`} className="mt-1 block text-xs text-neutral-400 transition hover:text-white">
                      {l.email}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-7 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Department Emails</div>
              <ul className="mt-4 flex flex-col gap-3">
                {DEPARTMENT_EMAILS.map((d) => (
                  <li key={d.email}>
                    <a href={`mailto:${d.email}`} className="group block">
                      <span className="block text-[13px] font-medium text-neutral-300 transition group-hover:text-white">
                        {d.department}
                      </span>
                      <span className="mt-0.5 block text-xs text-neutral-500 transition group-hover:text-neutral-300">
                        {d.email}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-neutral-800 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs leading-relaxed text-neutral-500">
              &copy; {new Date().getFullYear()} {COMPANY.name} All rights reserved.
              <br />
              <span className="text-neutral-500">
                Registered in the Republic of Ghana · Reg. No. {COMPANY.registrationNo} · TIN {COMPANY.taxId}
              </span>
            </div>
            <div className="flex gap-5 text-xs text-neutral-500">
              <span className="cursor-default transition hover:text-neutral-200">Privacy Policy</span>
              <span className="cursor-default transition hover:text-neutral-200">Terms of Service</span>
              <span className="cursor-default transition hover:text-neutral-200">Cookie Policy</span>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}