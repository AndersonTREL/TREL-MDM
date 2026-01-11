import prisma from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
import {
  Users,
  Laptop,
  AlertCircle,
  Box,
  Activity,
  Plus,
  List,
  ArrowRightLeft
} from 'lucide-react'

async function getData() {
  const [total, assigned, stock, repair, recentHistory] = await Promise.all([
    prisma.device.count(),
    prisma.device.count({ where: { status: 'Assigned' } }),
    prisma.device.count({ where: { status: 'In Stock' } }),
    prisma.device.count({ where: { status: 'In Repair' } }),
    prisma.assignmentHistory.findMany({
      take: 5,
      orderBy: { transferredAt: 'desc' },
      include: {
        device: true,
        fromPerson: true,
        toPerson: true
      }
    })
  ])

  return {
    stats: { total, assigned, stock, repair },
    history: recentHistory
  }
}

export default async function Dashboard() {
  const { stats, history } = await getData()

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Overview
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Welcome to <span className="text-emerald-400 font-semibold">TREL-MDM</span>. Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/inventory/new" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20">
            <Plus size={18} />
            Add Device
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Devices"
          value={stats.total}
          icon={Laptop}
          color="text-blue-400"
          bg="bg-blue-500/10"
          border="border-blue-500/20"
        />
        <StatCard
          title="Assigned"
          value={stats.assigned}
          icon={Users}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
          border="border-emerald-500/20"
        />
        <StatCard
          title="In Stock"
          value={stats.stock}
          icon={Box}
          color="text-purple-400"
          bg="bg-purple-500/10"
          border="border-purple-500/20"
        />
        <StatCard
          title="In Repair"
          value={stats.repair}
          icon={AlertCircle}
          color="text-orange-400"
          bg="bg-orange-500/10"
          border="border-orange-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Recent Activity */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity className="text-emerald-400" size={20} />
              Recent Activity
            </h3>
            <Link href="/inventory" className="text-sm text-gray-400 hover:text-white transition-colors">
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p>No recent activity recorded.</p>
              </div>
            ) : (
              history.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                      <ArrowRightLeft size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        <span className="text-emerald-400">{record.device.assetTag}</span>
                        <span className="text-gray-500 mx-2">was transferred to</span>
                        <span className="text-white">{record.toPerson?.name || 'Stock'}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(record.transferredAt).toLocaleDateString()} • {record.reason || 'No reason'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links / Secondary Panel */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-900/20 to-black/40 backdrop-blur-md">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/inventory" className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                <span className="flex items-center gap-3 text-sm font-medium text-gray-300 group-hover:text-white">
                  <List size={18} /> View Inventory
                </span>
                <span className="text-gray-600 group-hover:text-white">→</span>
              </Link>
              <Link href="/people" className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                <span className="flex items-center gap-3 text-sm font-medium text-gray-300 group-hover:text-white">
                  <Users size={18} /> Manage People
                </span>
                <span className="text-gray-600 group-hover:text-white">→</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, bg, border }: any) {
  return (
    <div className={`p-6 rounded-3xl border ${border} ${bg} backdrop-blur-md relative overflow-hidden group transition-all hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${color} opacity-80 uppercase tracking-wider`}>{title}</p>
          <p className="mt-2 text-4xl font-bold text-white tracking-tight">{value}</p>
        </div>
        <div className={`p-3 rounded-xl bg-white/5 ${color}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
}
