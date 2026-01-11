
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import TransferActions from './actions'
import LocationSelector from '@/components/LocationSelector'
// Needs to be a Client Component for state, but we can pass props? 
// Better: Create a Wrapper 'DeviceDetailView' that is server, and Actions component.

async function getDevice(id: string) {
    const device = await prisma.device.findUnique({
        where: { id },
        include: {
            assignment: { include: { person: true } },
            history: {
                orderBy: { transferredAt: 'desc' },
                include: {
                    fromPerson: true,
                    toPerson: true
                }
            },
            syncLogs: {
                orderBy: { timestamp: 'desc' },
                take: 1
            }
        }
    })
    return device
}

async function getPeople() {
    return await prisma.person.findMany({ orderBy: { name: 'asc' } })
}

export default async function DeviceDetailPage({ params }: { params: { id: string } }) {
    // Await params first if required by Next.js 15+, but standard 14 is sync or async dependent.
    // Assuming async page props standard.
    // For safety, assume async params access if using Next.js 15 (unlikely here but good practice).
    const { id } = await Promise.resolve(params);

    const device = await getDevice(id)
    const people = await getPeople()

    if (!device) return notFound()

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{device.assetTag}</h1>
                    <p className="text-gray-400 mt-1">{device.manufacturer} {device.model} • {device.serialNumber}</p>
                </div>
                <TransferActions deviceId={device.id} people={people} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Status & Metadata */}
                <div className="space-y-6">
                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                        <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-4">Current Status</h3>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-2xl font-semibold">{device.status}</span>
                            <div className={`h-3 w-3 rounded-full ${getStatusColor(device.status)}`}></div>
                        </div>

                        {device.assignment ? (
                            <div className="border-t border-white/10 pt-4 mt-4">
                                <p className="text-xs text-gray-500 uppercase mb-1">Assigned To</p>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white">
                                        {device.assignment.person.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{device.assignment.person.name}</p>
                                        <p className="text-sm text-gray-400">{device.assignment.person.role}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-3">
                                    Since {new Date(device.assignment.assignedAt).toLocaleDateString()}
                                </p>
                            </div>
                        ) : (
                            <p className="text-gray-500 italic mt-2">Available for assignment.</p>
                        )}
                    </div>

                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                        <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-4">Device Details</h3>
                        <dl className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-gray-400">Platform</dt>
                                <dd className="text-white">{device.platform}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-400">Serial Number</dt>
                                <dd className="text-white font-mono">{device.serialNumber || '-'}</dd>
                            </div>
                            <LocationSelector deviceId={device.id} initialLocation={device.location} />
                        </dl>
                    </div>
                </div>

                {/* Right Column: History Timeline */}
                <div className="lg:col-span-2">
                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                        <h3 className="text-lg font-semibold mb-6">Assignment History</h3>
                        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                            {device.history.length === 0 && (
                                <p className="text-gray-500 italic">No history recorded.</p>
                            )}
                            {device.history.map((event) => (
                                <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    {/* Icon */}
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 bg-gray-900 z-10">
                                        <svg className="fill-current text-white" xmlns="http://www.w3.org/2000/svg" width="12" height="10">
                                            <path fillRule="nonzero" d="M10.422 1.257 4.655 7.025 2.553 4.923A.916.916 0 0 0 1.257 6.22l2.75 2.75a.916.916 0 0 0 1.296 0l6.415-6.416a.916.916 0 0 0-1.296-1.296Z" />
                                        </svg>
                                    </div>

                                    {/* Content */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-white/10 bg-black/20 shadow-sm">
                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                            <div className="font-bold text-white">
                                                {event.toPerson ? `Assigned to ${event.toPerson.name}` : 'Returned to Stock'}
                                            </div>
                                            <time className="font-caveat font-medium text-indigo-400 text-xs">{new Date(event.transferredAt).toLocaleString()}</time>
                                        </div>
                                        <div className="text-gray-400 text-sm">
                                            {event.fromPerson ? (
                                                <span className="block mb-1">From: {event.fromPerson.name}</span>
                                            ) : (
                                                <span className="block mb-1">From: Stock</span>
                                            )}
                                            {event.reason && (
                                                <p className="italic">"{event.reason}"</p>
                                            )}
                                            <p className="text-xs text-gray-600 mt-2">By: {event.transferredBy}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}

function getStatusColor(status: string) {
    if (status === 'Assigned') return 'bg-green-500'
    if (status === 'In Stock') return 'bg-blue-500'
    if (status === 'In Repair') return 'bg-yellow-500'
    return 'bg-gray-500'
}
