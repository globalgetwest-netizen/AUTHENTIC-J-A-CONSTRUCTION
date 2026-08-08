import Link from "next/link";

interface DocCard {
  title: string;
  description: string;
  href: string;
  external?: boolean;
}

const DOC_CARDS: DocCard[] = [
  {
    title: "Company Profile",
    description:
      "Premium corporate capability statement — services, portfolio, fleet and company facts on letterhead.",
    href: "/api/admin/company-profile",
    external: true,
  },
  {
    title: "Worker Certificate",
    description:
      "Official Certificate of Employment for each worker — position, department, employment dates and seal.",
    href: "/admin/employees",
  },
  {
    title: "Employee ID Card",
    description: "Credit-card-sized staff ID with QR verification code, issued per employee.",
    href: "/admin/employee-ids",
  },
  {
    title: "Property Sale Ownership Certificate",
    description: "Certificate of Ownership issued to a buyer on completion of a property sale.",
    href: "/admin/property-sales",
  },
  {
    title: "Company Property Ownership",
    description: "Certificate confirming the company's ownership of each property in its portfolio.",
    href: "/admin/properties",
  },
  {
    title: "Asset Ownership",
    description: "Certificate of ownership for office, IT and operational assets in the asset register.",
    href: "/admin/assets",
  },
  {
    title: "Equipment & Vehicle Ownership",
    description: "Certificate of ownership for plant, machinery and the vehicle fleet.",
    href: "/admin/equipment",
  },
  {
    title: "Land Allocation Document",
    description: "Official allocation-of-land document for allocated plots.",
    href: "/admin/land-allocations",
  },
  {
    title: "Project Completion Certificate",
    description: "Certificate of Practical Completion for completed projects.",
    href: "/admin/projects",
  },
  {
    title: "Payslip",
    description: "Employee payslips per payroll period.",
    href: "/admin/payslips",
  },
];

export default function CorporateDocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Corporate documents</h1>
        <p className="text-sm text-neutral-500">
          Every official certificate and document the company issues — all on letterhead, all
          generated from real records.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOC_CARDS.map((card) => (
          <div
            key={card.title}
            className="flex flex-col rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-brand-blue/40 hover:shadow-sm"
          >
            <div className="flex-1">
              <h2 className="text-sm font-bold text-neutral-900">{card.title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">{card.description}</p>
            </div>
            <div className="mt-4">
              {card.external ? (
                <a
                  href={card.href}
                  className="inline-block rounded-md bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  Download PDF
                </a>
              ) : (
                <Link
                  href={card.href}
                  className="inline-block rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-brand-blue hover:text-brand-blue"
                >
                  Open registry
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
