import { NextRequest, NextResponse } from "next/server";

// FAQ Knowledge Base
const FAQ_KB: Record<string, string> = {
  "what is chatfusion.ai": "ChatFusion.ai is an AI-powered platform designed to help businesses automate conversations, improve customer support, and enhance user engagement.",
  "how do i create an account": "Click on the “Sign Up” button on the homepage, enter your details, and follow the verification steps to get started.",
  "is there a free trial available": "Yes, ChatFusion.ai offers a free trial so you can explore its features before upgrading to a premium plan.",
  "how can i reset my password": "Go to the login page, click “Forgot Password,” and follow the instructions sent to your registered email.",
  "what payment methods are accepted": "We accept major credit/debit cards and selected online payment methods depending on your region.",
  "can i upgrade or downgrade my plan anytime": "Yes, you can change your subscription plan anytime from your account settings.",
  "how do i contact support": "You can reach out through the in-app chat or email support, and our team will assist you promptly.",
  "is my data safe": "Yes, we use industry-standard security measures to keep your data safe and protected.",
  "is my data सुरक्षित": "Yes, we use industry-standard security measures to keep your data safe and protected."
};

const ESCALATION_KEYWORDS = ["human", "agent", "live person", "support team", "talk to someone", "representative"];

function getBestMatch(text: string): { response: string; isEscalated: boolean } {
  const textLower = text.toLowerCase().trim();

  // 1. Check for escalation
  if (ESCALATION_KEYWORDS.some(keyword => textLower.includes(keyword))) {
    return {
      response: "I am connecting you with a live support agent who can assist you further. Please wait a moment.",
      isEscalated: true
    };
  }

  // 2. Find best match in FAQ (simple includes check first)
  const questions = Object.keys(FAQ_KB);
  const directMatch = questions.find(q => textLower.includes(q) || q.includes(textLower));
  
  if (directMatch) {
    return { response: FAQ_KB[directMatch], isEscalated: false };
  }

  // 3. Fallback
  return {
    response: "I'm sorry, I couldn't find a specific answer to that in our knowledge base. You can try asking about our features, how to sign up, or request a human agent for more help.",
    isEscalated: false
  };
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    const { response, isEscalated } = getBestMatch(text);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send intent first if escalated
        if (isEscalated) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'intent', value: 'request_human' })}\n\n`));
        }

        // Simulate streaming response
        const words = response.split(" ");
        for (let i = 0; i < words.length; i++) {
          const content = words[i] + (i < words.length - 1 ? " " : "");
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', value: content })}\n\n`));
          await new Promise(r => setTimeout(r, 50)); // Simulating typing delay
        }

        // Send general query intent if not escalated
        if (!isEscalated) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'intent', value: 'general_query' })}\n\n`));
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
