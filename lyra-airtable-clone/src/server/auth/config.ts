import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
  ],
  adapter: PrismaAdapter(db),
  session: {
    strategy: "database", // Use database strategy for persistent sessions
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production", // Only secure in production (HTTPS)
        // Don't set domain - let browser use default (localhost for localhost)
        // This ensures cookies are shared across all tabs in the same browser window
      },
    },
  },
  trustHost: true, // Trust the host header (important for localhost)
  pages: {
    signIn: "/", // Sign-in page
  },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  // Streamlined logging output
  logger: {
    error(code, metadata) {
      console.error(`[Auth Error] ${code}`, metadata?.error?.message ?? "");
    },
    warn(code) {
      // Only output warnings when necessary
      if (code === "NO_SECRET") {
        console.warn(`[Auth Warn] ${code}`);
      }
    },
    debug(code, metadata) {
      // Do not output debug info by default
    },
  },
} satisfies NextAuthConfig;
