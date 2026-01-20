import "~/styles/globals.css";

import { TRPCReactProvider } from "~/trpc/react";
import { NextAuthSessionProvider } from "./_components/session-provider";

export const metadata = {
  title: "Airtable Clone",
  description: "A modern database interface",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NextAuthSessionProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}

