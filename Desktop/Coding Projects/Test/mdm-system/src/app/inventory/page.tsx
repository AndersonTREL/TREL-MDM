
import prisma from '@/lib/prisma'
import Link from 'next/link'

async function getDevices() {
    const devices = await prisma.device.findMany({
        include: {
            assignment: {
                include: { person: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })
    return devices
}

export default async function InventoryPage() {
    const devices = await getDevices()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Device Inventory</h1>
                    <p className="text-gray-400 mt-2">Manage all assets and assignments.</p>
                </div>
                <Link href="/inventory/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors">
                    Add New Device
                </Link>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Asset Tag</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Model</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Assigned To</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {devices.map((device) => (
                                <tr key={device.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                        <Link href={`/inventory/${device.id}`} className="hover:text-indigo-400 transition-colors">
                                            {device.assetTag}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {device.manufacturer} {device.model} ({device.platform})
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <StatusBadge status={device.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {device.assignment?.person ? (
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                                                    {device.assignment.person.name.charAt(0)}
                                                </div>
                                                <span>{device.assignment.person.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-500 italic">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {device.location || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/inventory/${device.id}`} className="text-indigo-400 hover:text-indigo-300">
                                            Manage
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    let color = "bg-gray-500/20 text-gray-400 border-gray-500/30"
    if (status === 'Assigned') color = "bg-green-500/20 text-green-400 border-green-500/30"
    if (status === 'In Stock') color = "bg-blue-500/20 text-blue-400 border-blue-500/30"
    if (status === 'In Repair') color = "bg-orange-500/20 text-orange-400 border-orange-500/30"
    if (status === 'Lost') color = "bg-red-500/20 text-red-400 border-red-500/30"

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
            {status}
        </span>
    )
}
