
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { randomUUID } from 'crypto'

// 1. Generate Token (Admin Action)
export async function POST(request: Request) {
    // Determine action from query or body? 
    // Let's support two modes: Generate (Admin) and Redeem (Mobile)
    // Actually, distinct routes are cleaner. Let's make this the "Redeem" / "Check" endpoint for mobile.
    // And we'll add a 'generate' action probably in a server action or separate API.

    // Simplification for MVP: This endpoint receives a "code" and returns a "session/token".

    try {
        const body = await request.json()
        const { code } = body

        // Mock validation for MVP 'demo-code'
        if (code === 'DEMO-123') {
            return NextResponse.json({
                success: true,
                token: 'valid-session-token',
                config: {
                    serverUrl: 'http://localhost:3000',
                    organization: 'My Company'
                }
            })
        }

        const validToken = await prisma.enrollmentToken.findUnique({
            where: { token: code }
        })

        if (!validToken || validToken.expiresAt < new Date() || validToken.usedAt) {
            return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })
        }

        // Mark used
        await prisma.enrollmentToken.update({
            where: { id: validToken.id },
            data: { usedAt: new Date() }
        })

        return NextResponse.json({
            success: true,
            token: 'valid-session-token',
            deviceId: validToken.deviceId // If pre-linked
        })

    } catch (error) {
        return NextResponse.json({ error: 'Enrollment failed' }, { status: 500 })
    }
}
