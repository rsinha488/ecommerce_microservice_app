import { Suspense } from "react";
import LoginPage from "./LoginPage";

/**
 * Login Page Wrapper
 *
 * Wraps the LoginPage component in Suspense to handle useSearchParams()
 * which requires client-side rendering.
 *
 * Next.js requires useSearchParams() to be wrapped in Suspense boundary
 * for proper SSR handling.
 */
export default function Page() {
  return (
    <Suspense fallback={
      <div className="container-custom py-12">
        <div className="max-w-md mx-auto">
          <div className="card">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginPage />
    </Suspense>
  );
}
