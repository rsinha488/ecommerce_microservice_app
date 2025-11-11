import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import StoreProvider from '@/components/StoreProvider';
import ConditionalLayout from '@/components/ConditionalLayout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'E-commerce Platform - Next.js with SSR',
  description: 'Modern e-commerce platform built with Next.js, Redux Toolkit, and SSR',
  keywords: ['e-commerce', 'nextjs', 'redux', 'ssr'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StoreProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="light"
          />
        </StoreProvider>
      </body>
    </html>
  );
}

