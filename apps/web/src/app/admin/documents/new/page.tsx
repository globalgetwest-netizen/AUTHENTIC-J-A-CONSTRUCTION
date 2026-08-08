import Link from "next/link";
import { DocumentUploadForm } from "@/components/admin/DocumentsForm";

export default function NewDocumentPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/admin/documents"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to documents
      </Link>
      <h1 className="text-xl font-bold text-neutral-900">Upload document</h1>
      <DocumentUploadForm />
    </div>
  );
}