
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddDevicePage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        location: 'DBE3', // Default
        assetTag: '', // Optional now, auto-gen if empty
        serialNumber: '',
        manufacturer: '',
        model: '',
        platform: 'Android',
    })
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            // Auto-generate Asset Tag if empty
            const payload = {
                ...formData,
                assetTag: formData.assetTag || `TAG-${Math.floor(Math.random() * 100000)}`
            }

            const res = await fetch('/api/devices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                router.push('/inventory')
                router.refresh()
            } else {
                alert('Error creating device')
            }
        } catch {
            alert('Error creating device')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Register New Device</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 border border-white/10 p-8 rounded-2xl">

                {/* Location - Prominent as requested */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Location *</label>
                    <select
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    >
                        <option value="DBE3">DBE3</option>
                        <option value="DBE2">DBE2</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Manufacturer *</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Samsung"
                            value={formData.manufacturer}
                            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Model *</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Galaxy S24"
                            value={formData.model}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Serial Number</label>
                        <input
                            type="text"
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Unique ID"
                            value={formData.serialNumber}
                            onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Asset Tag (Auto-generated if empty)</label>
                        <input
                            type="text"
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Optional"
                            value={formData.assetTag}
                            onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Platform *</label>
                    <select
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData.platform}
                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    >
                        <option value="Android">Android</option>
                        <option value="iOS">iOS</option>
                        <option value="Windows">Windows</option>
                        <option value="MacOS">MacOS</option>
                    </select>
                </div>

                <div className="flex gap-4 justify-end pt-4">
                    <button type="button" onClick={() => router.back()} className="px-6 py-2 text-gray-400 hover:text-white">Cancel</button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-lg font-medium shadow-lg transition-all"
                    >
                        {loading ? 'Saving...' : 'Register Device'}
                    </button>
                </div>
            </form>
        </div>
    )
}
