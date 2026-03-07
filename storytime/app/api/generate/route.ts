import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateStory, StoryInput } from "@/lib/anthropic"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function generateIllustration(prompt: string): Promise<string> {
  try {
    const enhancedPrompt = `Children's book illustration, warm watercolor style, hand-painted, soft pastel colors, cozy and whimsical, storybook aesthetic, gentle lighting. ${prompt}. Style: similar to classic children's books like Winnie the Pooh or Peter Rabbit, warm color palette, textured paper look, charming and innocent.`
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "natural",
    })

    return response.data?.[0]?.url ?? ""
  } catch (error) {
    console.error("Image generation error:", error)
    return ""
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { characterId, theme, setting, moral, additionalDetails } = body

    let character = null
    if (characterId) {
      character = await prisma.character.findFirst({
        where: { id: characterId, userId: session.user.id },
      })
    }

    const storyInput: StoryInput = {
      characterName: character?.name ?? body.characterName ?? "Alex",
      age: character?.age ?? body.age ?? 5,
      gender: character?.gender ?? body.gender ?? "child",
      hairColor: character?.hairColor ?? body.hairColor ?? "brown",
      hairStyle: character?.hairStyle ?? body.hairStyle ?? "curly",
      eyeColor: character?.eyeColor ?? body.eyeColor ?? "brown",
      skinTone: character?.skinTone ?? body.skinTone ?? "medium",
      personality: character?.personality
        ? JSON.parse(character.personality)
        : body.personality ?? ["curious", "kind"],
      hobbies: character?.hobbies
        ? JSON.parse(character.hobbies)
        : body.hobbies ?? ["reading", "exploring"],
      petName: character?.petName ?? undefined,
      petType: character?.petType ?? undefined,
      theme,
      setting,
      moral,
      additionalDetails,
    }

    // Create book record as "generating"
    const book = await prisma.book.create({
      data: {
        userId: session.user.id,
        characterId: characterId ?? null,
        title: "Generating...",
        theme,
        setting,
        moral,
        pages: "[]",
        status: "generating",
      },
    })

    // Generate story with Claude
    const story = await generateStory(storyInput)

    // Generate illustrations with DALL-E
    const pagesWithImages = await Promise.all(
      story.pages.map(async (page) => {
        const imageUrl = await generateIllustration(page.imagePrompt)
        return { ...page, imageUrl }
      })
    )

    // Update book with generated content
    const updatedBook = await prisma.book.update({
      where: { id: book.id },
      data: {
        title: story.title,
        pages: JSON.stringify(pagesWithImages),
        pageCount: pagesWithImages.length,
        status: "complete",
      },
    })

    return NextResponse.json(updatedBook)
  } catch (error) {
    console.error("Generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate story" },
      { status: 500 }
    )
  }
}
