import vinext from "vinext";
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: [],
  r2_buckets: [],
};

export default defineConfig({
  ssr: {
    // Firebase Admin relies on Node package metadata at runtime. Keep it external
    // to Vinext's server bundle so it starts correctly on Hostinger.
    external: [
      "firebase-admin",
      "firebase-admin/app",
      "firebase-admin/auth",
      "firebase-admin/firestore",
    ],
  },
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
      config: localBindingConfig,
    }),
  ],
});
