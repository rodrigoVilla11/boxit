import path from 'node:path';
import { fileURLToPath } from 'node:url';
import withSerwistInit from '@serwist/next';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  // En desarrollo desactivamos el SW para no cachear de más
  disable: process.env.NODE_ENV === 'development',
});

// El output "standalone" (para la imagen Docker) usa symlinks en el file-tracing,
// que Windows bloquea sin modo desarrollador. Lo activamos solo en el build de
// Docker con BUILD_STANDALONE=true; en local queda desactivado.
const standalone = process.env.BUILD_STANDALONE === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(standalone
    ? { output: 'standalone', outputFileTracingRoot: path.join(__dirname, '..') }
    : {}),
  reactStrictMode: true,
};

export default withSerwist(nextConfig);
