"use client";

import {
  Badge,
  Button,
  ButtonLink,
  Card,
  Container,
  Divider,
  Field,
  Heading,
  Input,
  Kicker,
  Spinner,
  Stack,
  Text,
  type BadgeTone,
  colors,
  semanticColors,
  fontSizes,
  spacing,
} from "@ajac/ui";

const swatchScales = [
  { name: "green", values: colors.green },
  { name: "blue", values: colors.blue },
  { name: "red", values: colors.red },
  { name: "neutral", values: colors.neutral },
] as const;

export default function DesignSystemPage() {
  return (
    <main>
      <header className="border-b border-border-muted bg-surface">
        <Container>
          <div className="py-10">
            <Kicker>Design system · Phase 2</Kicker>
            <Heading level={1}>AUTHENTIC brand foundation</Heading>
            <Text color="muted" className="mt-3 max-w-prose">
              The canonical tokens and primitives shared by the web app, mobile app and
              all future portals. Tokens live in <code>packages/ui/src/tokens.ts</code>.
            </Text>
          </div>
        </Container>
      </header>

      <Container>
        <div className="flex flex-col gap-12 py-12">
          <section>
            <Heading level={2}>Palette</Heading>
            <div className="mt-6 grid gap-8 md:grid-cols-2">
              {swatchScales.map((scale) => (
                <div key={scale.name}>
                  <Text weight="semibold" size="sm">{scale.name}</Text>
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {Object.entries(scale.values).map(([step, hex]) => (
                      <div key={step}>
                        <div className="h-10 rounded-md border border-black/5" style={{ background: hex }} />
                        <div className="mt-1 font-mono text-[10px] text-neutral-500">
                          {step} · {hex.replace("#", "").toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Divider tone="strong" />

          <section>
            <Heading level={2}>Typography</Heading>
            <div className="mt-6 flex flex-col gap-6">
              {(["5xl", "4xl", "3xl", "2xl", "xl", "lg", "base", "sm", "xs"] as const).map((s) => (
                <div key={s} className="flex items-baseline gap-6 border-b border-border-muted pb-4">
                  <span className="w-12 shrink-0 font-mono text-xs text-neutral-400">{s}</span>
                  <span style={{ fontSize: fontSizes[s] }} className="text-neutral-900">
                    The quick brown fox
                  </span>
                </div>
              ))}
            </div>
          </section>

          <Divider tone="strong" />

          <section>
            <Heading level={2}>Buttons</Heading>
            <Stack direction="row" gap={3} wrap align="flex-end">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
              <ButtonLink href="/" variant="primary" size="sm">Link · sm</ButtonLink>
              <Button size="lg" variant="primary">Button · lg</Button>
            </Stack>
          </section>

          <Divider tone="strong" />

          <section>
            <Heading level={2}>Badges</Heading>
            <Stack direction="row" gap={3} wrap>
              {(["neutral", "brand", "success", "warning", "danger", "info"] as BadgeTone[]).map((t) => (
                <Badge key={t} tone={t}>{t}</Badge>
              ))}
              {(["neutral", "brand", "success", "danger", "info"] as BadgeTone[]).map((t) => (
                <Badge key={t} tone={t} soft>{t} · soft</Badge>
              ))}
            </Stack>
          </section>

          <Divider tone="strong" />

          <section>
            <Heading level={2}>Cards</Heading>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <Card>
                <Stack wrap={false} gap={3}>
                  <Kicker color={semanticColors.primary}>Active project</Kicker>
                  <Heading level={3}>Works: Kotoka Intersection</Heading>
                  <Text size="sm" color="muted">
                    Road &amp; drainage upgrade — scope confirmed, mobilising.
                  </Text>
                  <Badge tone="brand" soft>In progress</Badge>
                </Stack>
              </Card>
              <Card interactive>
                <Stack wrap={false} gap={3}>
                  <Heading level={3}>Interactive card</Heading>
                  <Text size="sm" color="muted">Hover lifts this card.</Text>
                </Stack>
              </Card>
            </div>
          </section>

          <Divider tone="strong" />

          <section>
            <Heading level={2}>Forms</Heading>
            <form className="mt-6 grid max-w-md gap-6" onSubmit={(e) => e.preventDefault()}>
              <Field label="Full name">
                <Input name="name" placeholder="Kofi Mensah" />
              </Field>
              <Field label="Email" hint="We only use this to reply.">
                <Input name="email" type="email" placeholder="you@example.com" />
              </Field>
              <Field label="Phone" error="A 10-digit phone number is required.">
                <Input name="phone" type="tel" invalid />
              </Field>
              <Button type="submit">Submit</Button>
            </form>
          </section>

          <Divider tone="strong" />

          <section>
            <Heading level={2}>Feedback</Heading>
            <Stack direction="row" gap={4} align="center">
              <Spinner label="Checking…" />
              <span className="h-8" />
              {/* spacing scale reference */}
              <code className="font-mono text-xs text-neutral-400">{Object.keys(spacing).join(" ")}</code>
            </Stack>
          </section>
        </div>
      </Container>
    </main>
  );
}