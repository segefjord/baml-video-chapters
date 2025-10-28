import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import svelteSVG from "@hazycora/vite-plugin-svelte-svg";
import wh2viewBox from './src/lib/assets/icons/svgoplugin.js'

import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
const viteServerConfig: Plugin = {
	name: 'log-request-middleware',
	configureServer(server: ViteDevServer) {
		server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.setHeader("Access-Control-Allow-Methods", "GET");
			res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
			res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
			next();
		});
	}
};

export default defineConfig({
	plugins: [
		svelteSVG({
      svgoConfig: { // See https://github.com/svg/svgo#configuration
				plugins: [
          wh2viewBox,
        ]
			}, 
      requireSuffix: true, // Set false to accept '.svg' without the '?component'
    }),
		tailwindcss(),
		sveltekit(),
		viteServerConfig
	],
	server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
	optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  },
	build: {
    rollupOptions: {
      output: {
        // Put emitted workers under /workers instead of /_app/immutable/workers
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.includes('worker')) {
            return 'workers/[name].[hash][extname]'
          }
          return '_app/immutable/assets/[name].[hash][extname]'
        }
      }
    }
  },
});
