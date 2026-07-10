import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "Longstory Short",
    description:
      "Turn a story idea into a complete novel manuscript with one simple price.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7faf7",
    theme_color: "#07110d",
    icons: [
      {
        src: "/brand-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
