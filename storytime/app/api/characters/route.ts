import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const characters = await prisma.character.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(characters)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = await req.json()

  const character = await prisma.character.create({
    data: {
      userId: session.user.id,
      name: data.name,
      age: data.age,
      gender: data.gender,
      hairColor: data.hairColor,
      hairStyle: data.hairStyle,
      eyeColor: data.eyeColor,
      skinTone: data.skinTone,
      personality: JSON.stringify(data.personality),
      hobbies: JSON.stringify(data.hobbies),
      petName: data.petName,
      petType: data.petType,
      avatarDescription: data.avatarDescription,
    },
  })

  return NextResponse.json(character)
}
