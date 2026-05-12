import { NextRequest, NextResponse } from "next/server";

// FAQ Knowledge Base
const FAQ_KB: Record<string, string> = {
  "what are your business hours": "We are open Monday to Friday, 9 AM – 6 PM IST. On weekends we operate from 10 AM – 4 PM.",
  "how can i contact customer support": "You can reach us via live chat, email at support@company.com, or call us at 1800-XXX-XXXX (toll-free).",
  "i want to speak to a human agent": "Sure! I'm connecting you to a live agent. Please hold for a moment.",
  "what is your refund policy": "We offer a 30-day full refund policy on all products. Items must be unused and in original packaging.",
  "can i cancel my subscription": "Yes, you can cancel anytime from your account dashboard under 'Subscriptions'. No cancellation fee applies.",
  "how do i reset my password": "Click 'Forgot Password' on the login page and enter your registered email. You'll receive a reset link within 2 minutes.",
  "do you offer a free trial": "Yes! We offer a 14-day free trial with full access to all features. No credit card required.",
  "is my data secure with you": "Absolutely. We use AES-256 encryption and comply with GDPR & ISO 27001 standards to protect your data.",
  "what payment methods do you accept": "We accept Visa, Mastercard, UPI, Net Banking, PayPal, and EMI options.",
  "can i upgrade my plan": "Yes! Go to Settings > Subscription > Upgrade Plan to choose a new tier. Changes apply immediately.",
  "thank you that was helpful": "You're welcome! Is there anything else I can assist you with today?",
  "this is frustrating nothing is working": "I sincerely apologize for the inconvenience. Let me escalate this to our senior support team right away.",
  "goodbye": "Thank you for reaching out! Have a great day. Feel free to come back anytime. 😊",
  "what languages do you support": "Our platform currently supports English, Hindi, Tamil, Telugu, French, and Spanish.",
  "hello": "Hello! Welcome to our support center. How can I assist you today?",
  "hi": "Hello! Welcome to our support center. How can I assist you today?",
  "what is chatfusion.ai": "ChatFusion.ai is an AI-powered platform designed to help businesses automate conversations, improve customer support, and enhance user engagement.",
  "how do i create an account": "Click on the “Sign Up” button on the homepage, enter your details, and follow the verification steps to get started.",
  "is there a free trial available": "Yes, ChatFusion.ai offers a free trial so you can explore its features before upgrading to a premium plan.",
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
