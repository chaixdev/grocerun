import { NextResponse } from "next/server"
import { apiClient } from "@/core/lib/api-client"
import { z } from "zod"

const HealthSchema = z.object({ status: z.string() })

export async function GET() {
    try {
        await apiClient.get("/health", HealthSchema)
        return NextResponse.json({ status: "ok" }, { status: 200 })
    } catch (error) {
        console.error("Health check failed:", error)
        return NextResponse.json({ status: "error" }, { status: 500 })
    }
}
