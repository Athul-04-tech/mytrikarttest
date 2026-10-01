import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';

  if (isProd) {
    const rawApiUrl = env.VITE_API_BASE_URL ? env.VITE_API_BASE_URL.trim() : '';
    if (!rawApiUrl) {
      throw new Error(
        '[BUILD CONFIG ERROR] VITE_API_BASE_URL is missing or empty for production build. ' +
        'Production builds must specify an explicit API origin (e.g. VITE_API_BASE_URL="https://api-staging.example.com").'
      );
    }

    const lower = rawApiUrl.toLowerCase();
    if (lower.includes('localhost') || lower.includes('127.0.0.1')) {
      throw new Error(
        `[BUILD CONFIG ERROR] Invalid production VITE_API_BASE_URL="${rawApiUrl}". ` +
        'Production builds must not point to localhost or 127.0.0.1.'
      );
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    test: {
      environment: 'jsdom',
      globals: true,
    },
  };
});
