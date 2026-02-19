import { redirect } from "next/navigation";

/**
 * /operator  →  redirect instantly to /operator/dashboard
 */
export default function OperatorRootPage() {
  redirect("/operator/dashboard");
}
