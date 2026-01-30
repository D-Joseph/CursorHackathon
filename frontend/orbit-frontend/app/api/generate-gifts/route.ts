import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { personName, relationship, interests, dislikes, holidays } = body;

    const apiKey = process.env.MINIMAX_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "MiniMax API key not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a gift suggestion expert. Generate creative and thoughtful gift ideas.

Person: ${personName}
Relationship: ${relationship}
Interests: ${interests.length > 0 ? interests.join(", ") : "Not specified"}
Dislikes/Avoid: ${dislikes.length > 0 ? dislikes.join(", ") : "None specified"}
Gift occasions: ${holidays.length > 0 ? holidays.join(", ") : "General gifting"}

Generate exactly 8 unique gift ideas that:
1. Match their interests and hobbies
2. Are appropriate for the relationship
3. Avoid anything they dislike
4. Range from affordable to moderate price points
5. Are specific and actionable (not generic like "a book")

IMPORTANT: Respond ONLY with a JSON array of 8 gift ideas, nothing else.
Format: ["Gift 1", "Gift 2", "Gift 3", "Gift 4", "Gift 5", "Gift 6", "Gift 7", "Gift 8"]

Keep each gift name concise (2-5 words).`;

    const response = await fetch("https://api.minimax.chat/v1/text/chatcompletion_v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "MiniMax-Text-01",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate gift ideas now." },
        ],
        temperature: 0.8,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MiniMax API error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate gifts" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON array from the response
    let gifts: string[] = [];
    try {
      // Try to find JSON array in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        gifts = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If parsing fails, try to extract gift ideas manually
      const lines = content.split("\n").filter((line: string) => line.trim());
      gifts = lines
        .map((line: string) => line.replace(/^[\d\.\-\*]+\s*/, "").trim())
        .filter((line: string) => line.length > 0 && line.length < 50)
        .slice(0, 8);
    }

    // Ensure we have at least some default gifts
    if (gifts.length === 0) {
      gifts = [
        "Personalized Photo Album",
        "Cozy Blanket Set",
        "Gourmet Food Basket",
        "Experience Gift Card",
        "Custom Jewelry Piece",
        "Smart Home Gadget",
        "Subscription Box",
        "Artisan Candle Set",
      ];
    }

    return NextResponse.json({ gifts });
  } catch (error) {
    console.error("Generate gifts API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
