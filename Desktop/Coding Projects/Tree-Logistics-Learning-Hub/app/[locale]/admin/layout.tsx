import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Nav } from '@/components/nav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav role={session.user.role} userName={session.user.name || undefined} />
      {children}
    </div>
  )
}

