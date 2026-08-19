import type { ReactNode } from "react";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
      },
      {
        name: "description",
        content:
          "Flickbean is a screen-rub idle game. Stop tapping. Start rubbing.",
      },
      { name: "theme-color", content: "#0c0a0b" },
      { title: "Flickbean - rub, don't tap" },
      { property: "og:title", content: "Flickbean - rub, don't tap" },
      {
        property: "og:description",
        content: "Like a tap game, except you rub. Fast strokes, wet pops, frenzy prizes.",
      },
      { property: "og:url", content: "https://flickbean.jonbailey.xyz/" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://flickbean.jonbailey.xyz/og.jpg?v=1.1.0" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:alt", content: "Flickbean - rub, don't tap" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Flickbean - rub, don't tap" },
      { name: "twitter:description", content: "Stop tapping. Start rubbing." },
      { name: "twitter:image", content: "https://flickbean.jonbailey.xyz/og.jpg?v=1.1.0" },
    ],
    links: [
      { rel: "stylesheet", href: "/fonts/fontshare/fonts.css" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <script
          defer
          src="https://hits.jonbailey.xyz/c.js"
          data-site="flickbean"
        />
        <Scripts />
      </body>
    </html>
  );
}
