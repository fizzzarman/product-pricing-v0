"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// next-themes injects an inline <script> that applies the saved theme before
// first paint. React 19.2 warns about <script> tags rendered by components
// ("Scripts inside React components are never executed when rendering on the
// client"). The script only needs to run from the server-rendered HTML, so
// render it as executable on the server and as inert text/plain on the
// client; next-themes sets suppressHydrationWarning on the tag.
const scriptProps =
  typeof window === "undefined" ? undefined : ({ type: "text/plain" } as React.ComponentProps<"script">);

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider scriptProps={scriptProps} {...props}>
      {children}
    </NextThemesProvider>
  );
}
