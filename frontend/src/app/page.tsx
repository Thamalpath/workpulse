import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_CONFIG } from "@/config/auth";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_CONFIG.cookieName)?.value;

  if (token) {
    redirect(AUTH_CONFIG.routes.defaultAuthenticatedRedirect);
  } else {
    redirect(AUTH_CONFIG.routes.login);
  }
}
