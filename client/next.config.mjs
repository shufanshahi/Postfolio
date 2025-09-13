/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:8080/api/:path*', // Route through API Gateway
            },
        ];
    },

    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'X-Gateway-Client', value: 'postfolio-frontend' },
                ],
            },
        ];
    },
};

export default nextConfig;
