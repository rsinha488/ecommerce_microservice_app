import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4">E-commerce Platform</h3>
            <p className="text-gray-400 text-sm">
              Built with Next.js 14, Redux Toolkit, and Server-Side Rendering for
              optimal performance and SEO.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-400 hover:text-white transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-gray-400 hover:text-white transition-colors">
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-gray-400 hover:text-white transition-colors">
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Technologies */}
          <div>
            <h3 className="text-lg font-bold mb-4">Technologies</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>⚡ Next.js 14 (App Router)</li>
              <li>🔄 Redux Toolkit</li>
              <li>🎨 Tailwind CSS</li>
              <li>📡 REST API Integration</li>
              <li>🚀 Server-Side Rendering</li>
            </ul>
          </div>

          {/* Microservices */}
          <div>
            <h3 className="text-lg font-bold mb-4">Microservices</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>🔐 Auth Service (Port 4000)</li>
              <li>👤 User Service (Port 3001)</li>
              <li>📦 Product Service (Port 3002)</li>
              <li>📊 Inventory Service (Port 3003)</li>
              <li>🛒 Order Service (Port 5003)</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>© 2024 E-commerce Platform. Built with ❤️ using Next.js and Redux Toolkit</p>
          <p className="mt-2">
            Demonstrating SSR, Advanced State Management, and Microservices Architecture
          </p>
        </div>
      </div>
    </footer>
  );
}

