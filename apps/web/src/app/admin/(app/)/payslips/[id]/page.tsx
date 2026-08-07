"use client";

import { useParams } from "next/navigation";
import { PayslipView } from "@/components/admin/PayslipView";

export default function PayslipDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <PayslipView apiPath={`/api/admin/payslips/${id}`} backHref="/admin/payslips" />;
}