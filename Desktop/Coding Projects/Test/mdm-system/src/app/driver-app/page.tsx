
'use client'

import { useState } from 'react'

export default function DriverApp() {
    const [step, setStep] = useState<'enroll' | 'dashboard'>('enroll')
    const [enrollCode, setEnrollCode] = useState('')
    const [loading, setLoading] = useState(false)

    // Manual State
    const [deviceData, setDeviceData] = useState({
        manufacturer: '',
        model: '',
        location: 'DBE3', // Default
        androidVersion: '',
        serialNumber: '',
        platform: 'Android'
    })

    async function handleEnroll(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        if (enrollCode === 'DEMO-123') {
            setStep('dashboard')
        } else {
            try {
                const res = await fetch('/api/mobile/enroll', {
                    method: 'POST',
                    body: JSON.stringify({ code: enrollCode })
                })
                if (res.ok) setStep('dashboard')
                else alert('Invalid Code')
            } catch { alert('Error') }
        }
        setLoading(false)
    }

    async function handleSync() {
        setLoading(true)
        try {
            const payload = {
                ...deviceData,
                assetTag: `MOB-${Math.floor(Math.random() * 10000)}`,
                userId: 'Driver Manual Entry'
            }

            const res = await fetch('/api/mobile/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                alert('Device Registered Successfully!')
                setDeviceData({ ...deviceData, serialNumber: '' })
            } else {
                alert('Registration Failed')
            }
        } catch (e) {
            alert('Error')
        } finally {
            setLoading(false)
        }
    }

    if (step === 'enroll') {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans text-white">
                <div className="max-w-sm w-full bg-black/40 p-8 rounded-3xl border border-white/10 text-center">
                    <h2 className="text-2xl font-bold mb-6">Device Registration (Manual)</h2>
                    <input
                        type="text"
                        className="w-full bg-white/10 rounded-xl px-4 py-3 text-center mb-4"
                        placeholder="Enter Code (DEMO-123)"
                        value={enrollCode}
                        onChange={(e) => setEnrollCode(e.target.value)}
                    />
                    <button onClick={handleEnroll} className="w-full bg-green-600 py-3 rounded-xl font-bold">Start</button>
                    <p className="mt-4 text-xs text-gray-500">v2.1 - Manual Entry</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-900 font-sans text-white p-4">
            <div className="max-w-md mx-auto space-y-6">
                <header className="pb-4 border-b border-white/10">
                    <h1 className="text-xl font-bold">Register Inventory</h1>
                </header>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-5">

                    {/* Location Dropdown */}
                    <div>
                        <label className="block text-xs text-gray-400 uppercase font-bold mb-2">Location</label>
                        <select
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 appearance-none"
                            value={deviceData.location}
                            onChange={(e) => setDeviceData({ ...deviceData, location: e.target.value })}
                        >
                            <option value="DBE3">DBE3</option>
                            <option value="DBE2">DBE2</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Manual Entry Fields */}
                    <div>
                        <label className="block text-xs text-gray-400 uppercase font-bold mb-2">Manufacturer</label>
                        <input
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white"
                            placeholder="e.g. Samsung, Apple"
                            value={deviceData.manufacturer}
                            onChange={(e) => setDeviceData({ ...deviceData, manufacturer: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 uppercase font-bold mb-2">Model</label>
                        <input
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white"
                            placeholder="e.g. Galaxy S24"
                            value={deviceData.model}
                            onChange={(e) => setDeviceData({ ...deviceData, model: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 uppercase font-bold mb-2">Serial Number / Unique ID</label>
                        <input
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white"
                            placeholder="Unique Device ID"
                            value={deviceData.serialNumber}
                            onChange={(e) => setDeviceData({ ...deviceData, serialNumber: e.target.value })}
                        />
                    </div>
                </div>

                <button
                    onClick={handleSync}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-bold text-lg shadow-lg"
                >
                    {loading ? 'Saving...' : 'Register Device'}
                </button>
            </div>
        </div>
    )
}
