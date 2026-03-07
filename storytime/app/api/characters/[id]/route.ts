import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!character) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.character.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
