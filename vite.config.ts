import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const patientStickerProxyTarget = env.PATIENT_STICKER_WEBHOOK_PROXY_TARGET?.trim();
  const patientStickerProxyUrl = patientStickerProxyTarget
    ? new URL(patientStickerProxyTarget)
    : null;

  return {
    server: {
      host: "127.0.0.1",
      port: 8081,
      strictPort: true,
      hmr: {
        host: "localhost",
        port: 8081,
        clientPort: 8081,
        protocol: "ws",
      },
      proxy: patientStickerProxyUrl
        ? {
            "/api/patient-sticker-extract": {
              target: patientStickerProxyUrl.origin,
              changeOrigin: true,
              rewrite: () =>
                `${patientStickerProxyUrl.pathname}${patientStickerProxyUrl.search}`,
            },
          }
        : undefined,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
