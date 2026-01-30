import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, personName, relationship, currentInterests, currentDislikes, chatHistory } = body;

    const apiKey = process.env.MINIMAX_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "MiniMax API key not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a helpful gift-giving assistant. You're having a conversation to learn about ${personName}, who is the user's ${relationship}.

Your goal is to:
1. Learn about their interests, hobbies, and preferences
2. Understand what they DON'T like or already have
3. Extract useful information for gift suggestions

Current known interests: ${currentInterests.length > 0 ? currentInterests.join(", ") : "None yet"}
Current known dislikes: ${currentDislikes.length > 0 ? currentDislikes.join(", ") : "None yet"}

After each response, analyze the conversation and extract:
- Any new interests or hobbies mentioned
- Any dislikes or things to avoid

Be friendly, conversational, and ask follow-up questions to learn more. Keep responses concise (2-3 sentences max).

IMPORTANT: At the end of your response, add a JSON block in this exact format:
<extracted>{"interests": ["list", "of", "interests"], "dislikes": ["list", "of", "dislikes"]}</extracted>

Only include NEW items not already in the current lists. If no new items, use empty arrays.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.minimax.chat/v1/text/chatcompletion_v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "MiniMax-Text-01",
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MiniMax API error:", errorText);
      return NextResponse.json(
        { error: "Failed to get response from AI" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const fullResponse = data.choices?.[0]?.message?.content || "";

    // Parse extracted data
    let interests: string[] = [];
    let dislikes: string[] = [];
    let cleanResponse = fullResponse;

    const extractedMatch = fullResponse.match(/<extracted>(.*?)<\/extracted>/s);
    if (extractedMatch) {
      try {
        const extracted = JSON.parse(extractedMatch[1]);
        interests = extracted.interests || [];
        dislikes = extracted.dislikes || [];
        cleanResponse = fullResponse.replace(/<extracted>.*?<\/extracted>/s, "").trim();
      } catch {
        // Parsing failed, continue with empty arrays
      }
    }

    return NextResponse.json({
      response: cleanResponse,
      interests,
      dislikes,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
