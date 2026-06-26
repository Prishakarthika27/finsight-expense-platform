import { Sidebar } from "@/components/layout/sidebar"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Desktop: push content right by sidebar width */}
      {/* Mobile: add top padding for mobile topbar */}
      <div className="md:pl-60 pt-14 md:pt-0">
        {children}
      </div>
    </div>
  )
}