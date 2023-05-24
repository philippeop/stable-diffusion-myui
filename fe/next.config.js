/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
              source: '/sdapi/:path*',
              destination: `http://127.0.0.1:7861/sdapi/:path*`,
            },
            {
              source: '/myapi/:path*',
              destination: `http://localhost:7999/myapi/:path*`,
            },
            {
              source: '/ws',
              destination: `http://localhost:7999/ws`,
            }
        ]
    }
}

module.exports = nextConfig


