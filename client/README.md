# E-commerce Client - Next.js with SSR & Redux Toolkit

A modern e-commerce frontend built with **Next.js 14**, **Redux Toolkit**, and **Server-Side Rendering (SSR)** that integrates with a microservices backend.

## 🚀 Features

### Server-Side Rendering (SSR)
- ✅ **SEO Optimized** - Search engines can easily crawl and index pages
- ✅ **Faster Initial Load** - Content is rendered on the server
- ✅ **Better Performance** - Improved Core Web Vitals
- ✅ **Social Sharing** - Rich previews on social media

### Redux Toolkit State Management
- ✅ **Centralized State** - Predictable state management
- ✅ **Async Thunks** - Handle asynchronous operations
- ✅ **TypeScript Support** - Full type safety
- ✅ **Efficient Updates** - Optimized re-renders

### Features
- 🛍️ Product catalog with search and filtering
- 🛒 Shopping cart with persistent storage
- 👤 User authentication (login/register)
- 📦 Order management
- 🎨 Modern, responsive UI with Tailwind CSS
- ⚡ Fast navigation with Next.js App Router
- 🔄 Real-time cart updates

## 🏗️ Architecture

### Directory Structure

```
client/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout with Redux Provider
│   ├── page.tsx             # Home page (SSR)
│   ├── products/            # Products pages
│   ├── cart/                # Shopping cart
│   ├── orders/              # Order history
│   ├── login/               # Authentication
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ProductCard.tsx
│   ├── ProductGrid.tsx
│   ├── ProductsClient.tsx
│   └── StoreProvider.tsx
├── lib/                     # Business logic
│   ├── api/                 # API integration
│   │   ├── client.ts        # Axios clients
│   │   ├── auth.ts          # Auth API
│   │   ├── product.ts       # Product API
│   │   └── order.ts         # Order API
│   └── redux/               # Redux setup
│       ├── store.ts         # Store configuration
│       ├── hooks.ts         # Typed hooks
│       └── slices/          # Redux slices
│           ├── authSlice.ts
│           ├── productSlice.ts
│           ├── cartSlice.ts
│           └── orderSlice.ts
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.ts
```

## 🛠️ Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **State Management:** Redux Toolkit
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Rendering:** Server-Side Rendering (SSR)

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend microservices running

### 1. Install Dependencies

```bash
cd client
npm install
```

### 2. Configure Environment

Create a `.env.local` file (optional - defaults are set):

```env
API_AUTH_URL=http://localhost:4000
API_USER_URL=http://localhost:3001
API_PRODUCT_URL=http://localhost:3002
API_INVENTORY_URL=http://localhost:3003
API_ORDER_URL=http://localhost:5003

NEXT_PUBLIC_APP_NAME="E-commerce Platform"
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at **http://localhost:3000**

## 🚀 Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload

# Production
npm run build        # Build for production
npm run start        # Start production server

# Type Checking
npm run type-check   # Run TypeScript type checking

# Linting
npm run lint         # Run ESLint
```

## 📚 Key Concepts

### 1. Server-Side Rendering (SSR)

SSR renders pages on the server before sending them to the client:

**Benefits:**
- ✅ Better SEO - Search engines can crawl the content
- ✅ Faster First Contentful Paint (FCP)
- ✅ Improved performance on slow devices
- ✅ Better social media sharing

**Example (app/page.tsx):**
```typescript
// This is a Server Component - runs on the server
export default async function HomePage() {
  // Fetch data on the server
  const response = await productApi.getProducts({ limit: 8 });
  
  return (
    <div>
      <ProductGrid products={response.products} />
    </div>
  );
}
```

### 2. Redux Toolkit State Management

Redux Toolkit simplifies Redux with best practices built-in:

**Features:**
- Simplified store setup
- Built-in Immer for immutable updates
- createAsyncThunk for async operations
- TypeScript support

**Example (lib/redux/slices/cartSlice.ts):**
```typescript
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      // Immer allows "mutating" syntax
      const existingItem = state.items.find(item => item._id === action.payload._id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },
  },
});
```

### 3. Advanced Patterns

#### Client and Server Components

```typescript
// Server Component (default in App Router)
export default async function ProductsPage() {
  const products = await fetchProducts(); // Runs on server
  return <ProductsClient initialProducts={products} />;
}

// Client Component (interactive features)
'use client';
export default function ProductsClient({ initialProducts }) {
  const [products, setProducts] = useState(initialProducts);
  // Can use useState, useEffect, Redux hooks, etc.
}
```

#### Redux with Server Components

```typescript
// StoreProvider.tsx - Wraps client components
'use client';
export default function StoreProvider({ children }) {
  const storeRef = useRef();
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }
  return <Provider store={storeRef.current}>{children}</Provider>;
}
```

## 🔌 API Integration

### Microservices Architecture

The client connects to 5 backend microservices:

| Service | Port | Purpose |
|---------|------|---------|
| Auth Service | 4000 | Authentication & Authorization |
| User Service | 3001 | User management |
| Product Service | 3002 | Product catalog |
| Inventory Service | 3003 | Stock management |
| Order Service | 5003 | Order processing |

### API Client Setup

**lib/api/client.ts:**
```typescript
// Create axios clients with interceptors
const authClient = createApiClient(API_URLS.auth);

// Automatically adds auth token to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 🎨 Styling

### Tailwind CSS

Custom utilities and components defined in `globals.css`:

```css
/* Custom button styles */
.btn-primary {
  @apply bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg;
}

/* Custom card styles */
.card {
  @apply bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow;
}
```

### Responsive Design

Mobile-first approach with Tailwind breakpoints:
- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up
- `xl:` - 1280px and up

## 🔒 Authentication

### Flow
1. User enters credentials on `/login`
2. Redux action dispatches login request
3. Auth service returns JWT token
4. Token stored in localStorage
5. Token automatically added to API requests

### Usage
```typescript
// In any component
const { isAuthenticated, user } = useAppSelector(state => state.auth);
const dispatch = useAppDispatch();

// Login
dispatch(login({ email, password }));

// Logout
dispatch(logout());
```

## 🛒 Shopping Cart

### Features
- Add/remove items
- Update quantities
- Persistent storage (localStorage)
- Real-time total calculations

### Redux Implementation
```typescript
// Add to cart
dispatch(addToCart(product));

// Update quantity
dispatch(updateQuantity({ id, quantity }));

// Remove item
dispatch(removeFromCart(id));

// Clear cart
dispatch(clearCart());
```

## 📦 Building for Production

### Build

```bash
npm run build
```

This creates an optimized production build:
- Minified JavaScript and CSS
- Optimized images
- Server-side rendering
- Static page generation where possible

### Start Production Server

```bash
npm run start
```

## 🔧 Configuration

### next.config.js

```javascript
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    // API URLs configured here
  },
};
```

### TypeScript Configuration

Full type safety with strict mode enabled in `tsconfig.json`.

## 🧪 Testing

### Test the Application

1. **Start Backend Services:**
   ```bash
   cd ..
   ./start-all-services.ps1  # or .sh on Linux/Mac
   ```

2. **Start Client:**
   ```bash
   cd client
   npm run dev
   ```

3. **Test Features:**
   - Visit http://localhost:3000
   - Browse products (fetched via SSR)
   - Add items to cart
   - Login/Register
   - View orders

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 Best Practices

### Server vs Client Components

**Use Server Components for:**
- Data fetching
- Accessing backend resources
- Keeping sensitive information on server
- Reducing client-side JavaScript

**Use Client Components for:**
- Interactivity (onClick, onChange)
- State management (useState, Redux)
- Browser-only APIs
- Effects (useEffect)

### Performance Optimization

1. **Use SSR for initial page load**
2. **Implement ISR for static-like pages**
3. **Code splitting with dynamic imports**
4. **Optimize images with next/image**
5. **Minimize client-side state**

## 🐛 Troubleshooting

### Common Issues

**API Connection Failed:**
- Ensure backend services are running
- Check API URLs in `.env.local`
- Verify CORS settings

**Redux State Not Persisting:**
- Check localStorage is available
- Verify StoreProvider wraps app
- Check browser console for errors

**SSR Hydration Mismatch:**
- Don't use `window` or `localStorage` during render
- Use `useEffect` for client-only code
- Check server/client HTML matches

## 📖 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

This is an educational project demonstrating:
- Server-Side Rendering with Next.js
- Advanced State Management with Redux Toolkit
- Microservices Integration
- Modern React Patterns

## 📄 License

MIT

---

**Built with ❤️ using Next.js 14, Redux Toolkit, and TypeScript**

