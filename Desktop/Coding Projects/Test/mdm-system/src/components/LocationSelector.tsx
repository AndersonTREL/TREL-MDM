'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'

// You can make this dynamic later if needed
const LOCATIONS = [
    'DBE3',
    'DBE2'
]

export default function LocationSelector({ deviceId, initialLocation }: { deviceId: string, initialLocation: string | null }) {
    const [location, setLocation] = useState(initialLocation || '')
    const [loading, setLoading] = useState(false)

    async function handleChange(newLocation: string) {
        setLoading(true)
        setLocation(newLocation)

        try {
            await fetch(`/api/devices/${deviceId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location: newLocation })
            })
            // Optional: Toast notification
        } catch (e) {
            console.error('Failed to update location', e)
            alert('Failed to update location')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-between group">
            <dt className="text-gray-400 flex items-center gap-2">
                Location
            </dt>
            <dd className="text-right">
                <select
                    value={location}
                    onChange={(e) => handleChange(e.target.value)}
                    disabled={loading}
                    className="bg-transparent text-white font-mono text-right border-none outline-none focus:ring-0 cursor-pointer hover:text-indigo-400 transition-colors py-0 pr-0"
                >
                    <option value="" className="bg-gray-900 text-gray-500">Select Location...</option>
                    {LOCATIONS.map(loc => (
                        <option key={loc} value={loc} className="bg-gray-900 text-white">
                            {loc}
                        </option>
                    ))}
                </select>
            </dd>
        </div>
    )
}
