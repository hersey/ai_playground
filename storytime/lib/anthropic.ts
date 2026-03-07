import Anthropic from "@anthropic-ai/sdk"

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface StoryPage {
  pageNumber: number
  text: string
  imagePrompt: string
  imageUrl?: string
}

export interface StoryInput {
  characterName: string
  age: number
  gender: string
  hairColor: string
  hairStyle: string
  eyeColor: string
  skinTone: string
  personality: string[]
  hobbies: string[]
  petName?: string
  petType?: string
  theme: string
  setting: string
  moral: string
  additionalDetails?: string
}

export async function generateStory(input: StoryInput): Promise<{
  title: string
  pages: StoryPage[]
}> {
  const characterDescription = `
    Name: ${input.characterName} (${input.age} years old, ${input.gender})
    Appearance: ${input.hairColor} ${input.hairStyle} hair, ${input.eyeColor} eyes, ${input.skinTone} skin tone
    Personality: ${input.personality.join(", ")}
    Hobbies: ${input.hobbies.join(", ")}
    ${input.petName ? `Pet: A ${input.petType} named ${input.petName}` : ""}
  `

  const stream = anthropic.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    messages: [
      {
        role: "user",
        content: `Create a warm, engaging children's book story for a ${input.age}-year-old child.

CHARACTER:
${characterDescription}

STORY PARAMETERS:
- Theme: ${input.theme}
- Setting: ${input.setting}  
- Moral/Lesson: ${input.moral}
${input.additionalDetails ? `- Additional details: ${input.additionalDetails}` : ""}

Please write a 10-page children's book. For each page, provide:
1. The story text (2-4 sentences, appropriate for a ${input.age}-year-old)
2. A detailed image prompt for a warm, hand-illustrated watercolor style illustration

Format your response as valid JSON:
{
  "title": "Book title here",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Story text for this page...",
      "imagePrompt": "Detailed description for warm watercolor children's book illustration: [describe the scene, character's appearance, setting, mood, style notes: warm colors, hand-drawn watercolor, cozy children's book illustration style]"
    }
  ]
}

Guidelines:
- Make ${input.characterName} the hero of the story
- Use simple, joyful language
- Build to a satisfying conclusion that teaches the moral: ${input.moral}
- Each page image should show ${input.characterName} clearly with their described appearance
- Image prompts should specify: warm watercolor style, soft colors, cozy children's book feel, hand-illustrated look`,
      },
    ],
  })

  const response = await stream.finalMessage()
  
  const textContent = response.content.find(block => block.type === "text")
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in response")
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("No JSON found in response")
  }

  const storyData = JSON.parse(jsonMatch[0])
  return storyData
}
