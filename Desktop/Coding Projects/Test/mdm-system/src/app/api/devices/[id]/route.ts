
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const { id } = params;

        const device = await prisma.device.findUnique({
            where: { id },
            include: {
                assignment: {
                    include: { person: true }
                },
                history: {
                    orderBy: { transferredAt: 'desc' },
                    include: {
                        fromPerson: true,
                        toPerson: true
                    }
                },
                syncLogs: {
                    orderBy: { timestamp: 'desc' },
                    take: 5
                }
            }
        })

        if (!device) return NextResponse.json({ error: 'Device not found' }, { status: 404 })

        return NextResponse.json(device)
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch device' }, { status: 500 })
    }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const { id } = params;
        const body = await request.json()

        const updated = await prisma.device.update({
            where: { id },
            data: {
                location: body.location
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Update failed:', error)
        return NextResponse.json({ error: 'Failed to update device' }, { status: 500 })
    }
}
