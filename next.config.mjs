/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite compilar variantes de prueba (p. ej. E2E con emuladores de Firebase) sin pisar .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    unoptimized: true,
  },
 
}

export default nextConfig
