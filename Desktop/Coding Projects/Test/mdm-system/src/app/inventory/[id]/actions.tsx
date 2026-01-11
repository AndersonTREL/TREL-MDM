
'use client'

import { useState } from 'react'
import TransferModal from '@/components/TransferModal'

export default function TransferActions({ deviceId, people }: { deviceId: string, people: any[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
            >
                Transfer / Update
            </button>

            {isModalOpen && (
                <TransferModal
                    deviceId={deviceId}
                    people={people}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    )
}
