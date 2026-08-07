"use client";

import { useParams } from "next/navigation";
import { PayslipView } from "@/components/admin/PayslipView";

export default function StaffPayslipDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <PayslipView apiPath={`/api/staff/payslips/${id}`} backHref="/staff/payslips" />;
}