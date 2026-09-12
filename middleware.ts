export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customers/:path*",
    "/properties/:path*",
    "/enquiries/:path*",
    "/quotes/:path*",
    "/jobs/:path*",
    "/calendar/:path*",
    "/previous-work/:path*",
    "/follow-ups/:path*",
    "/maintenance/:path*",
    "/invoices/:path*",
    "/reports/:path*",
    "/team/:path*",
    "/settings/:path*",
    "/search/:path*",
  ],
};
