// The root app/loading.tsx renders the dark app-shell skeleton (needed for the
// /app layout's cold load). The landing page gets its own boundary so
// logged-out visitors never see a fake dashboard flash before the marketing page.
export default function Loading() {
  return <div className="min-h-screen bg-white" />
}
