import { Inter } from 'next/font/google'

import { Providers } from '@/store/provider'
import '@/globals.scss'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'sd-myui',
    description: '',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <Providers>
                <body className={inter.className}>{children}</body>
            </Providers>
        </html>
    )
}
