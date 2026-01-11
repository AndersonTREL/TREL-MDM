
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Person = {
    id: string
    name: string
    role: string | null
}

export default function TransferModal({ deviceId, people, onClose }: { deviceId: string, people: Person[], onClose: () => void }) {
    const router = useRouter()
    const [selectedPerson, setSelectedPerson] = useState<string>('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleTransfer() {
        setLoading(true)
        try {
            // If newOwnerId is empty string, send null. If it is REPAIR, send REPAIR string.
            let ownerIdToSend = null;
            if (selectedPerson === 'REPAIR') ownerIdToSend = 'REPAIR';
            else if (selectedPerson !== '') ownerIdToSend = selectedPerson;

            const res = await fetch('/api/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId,
                    newOwnerId: ownerIdToSend,
                    notes,
                    adminName: 'Admin User'
                })
            })

            if (res.ok) {
                router.refresh()
                onClose()
            } else {
                alert('Transfer failed')
            }
        } catch (e) {
            console.error(e)
            alert('Error processing transfer')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-xl font-bold mb-4">Transfer / Assign Device</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">New Owner</label>
                        <select
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={selectedPerson}
                            onChange={(e) => setSelectedPerson(e.target.value)}
                        >
                            <option value="" className="bg-gray-800">Unassign (Return to Stock)</option>
                            <option value="REPAIR" className="bg-gray-800">Send to Repair</option>
                            {people.map(person => (
                                <option key={person.id} value={person.id} className="bg-gray-800">
                                    {person.name} ({person.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Notes / Reason</label>
                        <textarea
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. New Hire, Replacement, Repair..."
                        />
                    </div>

                    <div className="flex gap-3 justify-end mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleTransfer}
                            disabled={loading}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Confirm Transfer'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
