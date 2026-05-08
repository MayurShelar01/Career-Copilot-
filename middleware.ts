import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // updateSession automatically gets the user and returns the response
  const { response, user } = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // Protect /parse and /tracker
  if (pathname.startsWith("/parse") || pathname.startsWith("/tracker")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return Response.redirect(url);
    }
  }

  // Redirect authenticated users away from /login
  if (pathname === "/login") {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = "/parse";
      return Response.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
