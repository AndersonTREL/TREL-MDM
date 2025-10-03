import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Nav } from '@/components/nav'

export default async function InspectorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login')
  }

  if (!['ADMIN', 'INSPECTOR'].includes(session.user.role)) {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav role={session.user.role} userName={session.user.name || undefined} />
      {children}
    </div>
  )
}

