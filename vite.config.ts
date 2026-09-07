import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, type Plugin} from 'vite';

function saveLogoPlugin(): Plugin {
  return {
    name: 'save-logo-endpoint',
    configureServer(server) {
      server.middlewares.use('/api/save-logo', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { dataUrl } = JSON.parse(body);
              if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
                const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');

                // Write to public/assets/wecare_logo.png and public/wecare_logo.png
                fs.writeFileSync(path.resolve(__dirname, 'public/assets/wecare_logo.png'), buffer);
                fs.writeFileSync(path.resolve(__dirname, 'public/wecare_logo.png'), buffer);

                // Write to logoBase64.ts
                const tsContent = `// Permanently saved official WeCare logo\nexport const WECARE_LOGO_BASE64 = "${dataUrl}";\n`;
                fs.writeFileSync(path.resolve(__dirname, 'src/assets/logoBase64.ts'), tsContent);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
                return;
              }
            } catch (err) {
              console.error('Error in /api/save-logo:', err);
            }
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid logo data' }));
          });
        } else {
          res.writeHead(405);
          res.end();
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), saveLogoPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
