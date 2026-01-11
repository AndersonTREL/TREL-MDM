
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Person = {
    id: string
    name: string
    email: string
    role: string
    station?: string
    assignment: any[]
}

export default function PeoplePage() {
    const [people, setPeople] = useState<Person[]>([])
    const [showImport, setShowImport] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [importText, setImportText] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetch('/api/people').then(res => res.json()).then(setPeople)
    }, [])

    async function handleImport() {
        setLoading(true)

        try {
            if (file) {
                // Handle Excel Upload
                const formData = new FormData()
                formData.append('file', file)

                const res = await fetch('/api/people', {
                    method: 'POST',
                    body: formData,
                })

                const data = await res.json()

                if (res.ok) {
                    const newPeople = await fetch('/api/people').then(r => r.json())
                    setPeople(newPeople)
                    setShowImport(false)
                    setFile(null)
                    setImportText('')
                    alert(`Imported ${data.count} people successfully!`)
                } else {
                    alert(data.error || 'Upload failed')
                }

            } else if (importText.trim()) {
                // Parse CSV/Text (Name, LastName, Station)
                const lines = importText.split('\n')
                const payload = lines.map(line => {
                    const [firstName, lastName, station] = line.split(',').map(s => s.trim())
                    if (!firstName || !lastName) return null
                    const name = `${firstName} ${lastName}`
                    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`
                    return { name, email, role: 'Employee', station: station || null }
                }).filter(Boolean)

                const res = await fetch('/api/people', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                if (res.ok) {
                    // Refresh
                    const newPeople = await fetch('/api/people').then(r => r.json())
                    setPeople(newPeople)
                    setShowImport(false)
                    setImportText('')
                    alert('Imported successfully')
                }
            }
        } catch (e) { alert('Error processing import') }

        setLoading(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure?')) return
        const res = await fetch(`/api/people?id=${id}`, { method: 'DELETE' })
        if (res.ok) {
            setPeople(people.filter(p => p.id !== id))
        } else {
            const err = await res.json()
            alert(err.error || 'Failed to delete')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">People Directory</h1>
                    <p className="text-gray-400 mt-2">Staff members and their assigned equipment.</p>
                </div>
                <button
                    onClick={() => setShowImport(!showImport)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium"
                >
                    {showImport ? 'Close' : 'Import / Add Bulk'}
                </button>
            </div>

            {showImport && (
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl animate-in slide-in-from-top-4">
                    <h3 className="font-bold mb-2">Bulk Import</h3>

                    <div className="mb-4 p-3 border border-dashed border-white/20 rounded-lg">
                        <p className="text-xs text-gray-400 mb-2">Option 1: Upload Excel (.xlsx)</p>
                        <input
                            type="file"
                            accept=".xlsx"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                        />
                    </div>

                    <p className="text-xs text-gray-400 mb-2">Option 2: Paste Text (Format: Name, Last Name, Station)</p>
                    <textarea
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm h-32 font-mono"
                        placeholder={`John, Doe, London Station\nJane, Smith, Berlin Hub`}
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                    />
                    <button
                        onClick={handleImport}
                        disabled={loading}
                        className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-bold"
                    >
                        {loading ? 'Importing...' : 'Process Import'}
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {people.map(person => (
                    <div key={person.id} className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm group hover:border-indigo-500/30 transition-colors relative">
                        <button
                            onClick={() => handleDelete(person.id)}
                            className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors"
                        >
                            ✕
                        </button>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-lg font-bold text-white border border-white/10">
                                {person.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">{person.name}</h3>
                                <p className="text-sm text-gray-400">{person.role} {person.station && `• ${person.station}`}</p>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-medium">Assigned Devices</p>
                            {person.assignment?.length > 0 ? (
                                <ul className="space-y-2">
                                    {person.assignment.map((assign: any) => (
                                        <li key={assign.id} className="flex items-center justify-between text-sm bg-white/5 p-2 rounded-lg">
                                            <Link href={`/inventory/${assign.deviceId}`} className="text-gray-200 hover:text-white truncate">
                                                {assign.device.assetTag}
                                            </Link>
                                            <span className="text-xs text-gray-500">{assign.device.model}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-600 italic">No devices assigned.</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
