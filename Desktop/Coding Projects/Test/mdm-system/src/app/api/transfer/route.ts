
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { deviceId, newOwnerId, notes, adminName } = body

        if (!deviceId || !adminName) {
            return NextResponse.json({ error: 'Missing deviceId or adminName' }, { status: 400 })
        }

        // atomic transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get current assignment to know previous owner
            const currentAssignment = await tx.assignment.findUnique({
                where: { deviceId }
            })
            const previousOwnerId = currentAssignment?.personId

            // 2. Handle Assignment Table
            if (newOwnerId && newOwnerId !== 'REPAIR') {
                // Upsert assignment for this device
                await tx.assignment.upsert({
                    where: { deviceId },
                    create: {
                        deviceId,
                        personId: newOwnerId,
                        notes
                    },
                    update: {
                        personId: newOwnerId,
                        assignedAt: new Date(),
                        notes
                    }
                })

                // Update Device Status
                await tx.device.update({
                    where: { id: deviceId },
                    data: { status: 'Assigned' }
                })
            } else if (newOwnerId === 'REPAIR') {
                // Handle Repair
                if (currentAssignment) {
                    await tx.assignment.delete({ where: { deviceId } })
                }
                await tx.device.update({
                    where: { id: deviceId },
                    data: { status: 'In Repair' }
                })
            } else {
                // If unassigning (sending to Stock)
                if (currentAssignment) {
                    await tx.assignment.delete({
                        where: { deviceId }
                    })
                }

                // Update Device Status
                await tx.device.update({
                    where: { id: deviceId },
                    data: { status: 'In Stock' }
                })
            }
            // 3. Create History Entry
            const history = await tx.assignmentHistory.create({
                data: {
                    deviceId,
                    fromPersonId: previousOwnerId || null,
                    toPersonId: (newOwnerId && newOwnerId !== 'REPAIR') ? newOwnerId : null,
                    transferredBy: adminName,
                    reason: newOwnerId === 'REPAIR' ? 'Sent to Repair' : notes,
                    notes: notes
                }
            })

            return history
        })

        return NextResponse.json({ success: true, history: result })

    } catch (error) {
        console.error('Error processing transfer:', error)
        return NextResponse.json({ error: 'Failed to process transfer' }, { status: 500 })
    }
}
