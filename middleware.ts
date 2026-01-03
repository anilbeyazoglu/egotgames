import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function isAuthorized(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return false;
  }

  const base64Credentials = authHeader.split(" ")[1];
  if (!base64Credentials) return false;

  let decodedCredentials = "";
  try {
    decodedCredentials = atob(base64Credentials);
  } catch (error) {
    return false;
  }

  const [username, ...passwordParts] = decodedCredentials.split(":");
  const password = passwordParts.join(":");

  const expectedUser = process.env.ADMIN_BASIC_USER || "admin";
  const expectedPassword = process.env.ADMIN_BASIC_PASSWORD || "admin123";

  return username === expectedUser && password === expectedPassword;
}

function unauthorizedResponse() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin Area"',
    },
  });
}

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isAdminPath = pathname === "/su" || pathname.startsWith("/su/");
  const hasLocalePrefix = routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (isAdminPath) {
    if (!isAuthorized(req)) {
      return unauthorizedResponse();
    }
    return NextResponse.next();
  }

  if (hasLocalePrefix || pathname === "/") {
    return intlMiddleware(req);
  }

  return NextResponse.next();
}

export const config = {
  // Match internationalized pathnames and the admin entry without locale
  matcher: ["/", "/(tr|en)/:path*", "/su", "/su/:path*"],
};
