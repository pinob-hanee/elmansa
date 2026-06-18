import { GoogleGenAI } from '@google/genai';
import { prisma } from '../../config/database';

export class AiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      console.warn('GEMINI_API_KEY not found in environment. AI Assistant will return placeholder responses.');
    }
  }

  async chat(userId: string, message: string, history: any[] = []) {
    // 1. Gather context about the student
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        enrollments: {
          include: {
            course: true,
          }
        }
      }
    });

    if (!user) throw new Error('User not found');

    const courseNames = user.enrollments.map(e => e.course.title).join(', ') || 'None';
    
    const systemInstruction = `
      You are El-Mansa AI, a helpful, friendly, and concise assistant for a learning platform called "El-Mansa".
      You help students with questions about the site, their courses, or general educational topics.
      
      User's Name: ${user.profile?.firstName || 'Student'}
      User's Enrolled Courses: ${courseNames}
      
      Keep your answers short, encouraging, and formatted in Markdown. If the user asks about something outside your scope, kindly guide them back to topics related to their courses or the platform.
      Always respond in the same language the user writes to you in (Arabic or English).
    `;

    if (!this.ai) {
      // Fallback placeholder if no API key
      return {
        reply: `Hello ${user.profile?.firstName || ''}! I am the AI assistant. (GEMINI_API_KEY is not configured on the server, so I cannot process your actual request: "${message}")`,
      };
    }

    try {
      const formattedHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          ...formattedHistory,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      return {
        reply: response.text || 'I could not generate a response at this time.',
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to communicate with AI provider');
    }
  }
}

export const aiService = new AiService();
