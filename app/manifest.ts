import type { MetadataRoute } from "next";

// Lets SnackDesk be added to the home screen. iPhones only show web push
// notifications for sites added this way.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SnackDesk",
    short_name: "SnackDesk",
    description: "Office snack ordering",
    // login sends a signed-in user to their own dashboard
    start_url: "/login",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#d97757",
    icons: [{ src: "/logo.png", sizes: "1024x1024", type: "image/png", purpose: "any" }],
  };
}
