import { NextResponse } from "next/server"
import { prisma } from "@/core/db"

export async function GET() {
    try {
        // Simple DB check
        await prisma.$queryRaw`SELECT 1`
        return NextResponse.json({ status: "ok" }, { status: 200 })
    } catch (error) {
        console.error("Health check failed:", error)
        return NextResponse.json({ status: "error" }, { status: 500 })
    }
}
