import { GoogleGenAI, Type } from "@google/genai";
import { AgendaItem, Task } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found in env");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// --- GENERATE AGENDA ---

export const generateSmartAgenda = async (topic: string, durationStr: string): Promise<AgendaItem[]> => {
  const client = getClient();
  if (!client) return [];

  const prompt = `Create a professional meeting agenda for a meeting about "${topic}" lasting "${durationStr}". 
  Return a JSON array of agenda items. Each item should have a 'topic' and suggested 'duration'.
  Make it structured and concise. Language: French.`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              duration: { type: Type.STRING }
            }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data.map((item: any, index: number) => ({
        id: `gen-${Date.now()}-${index}`,
        topic: item.topic,
        duration: item.duration,
        completed: false
      }));
    }
    return [];
  } catch (error) {
    console.error("Error generating agenda:", error);
    return [];
  }
};

// --- SUMMARIZE MEETING ---

export interface MeetingSummaryResult {
  summary: string;
  actionItems: { description: string; assignee: string }[];
}

export const generateMeetingSummary = async (notes: string, participants: string[]): Promise<MeetingSummaryResult | null> => {
  const client = getClient();
  if (!client) return null;

  const participantsStr = participants.join(", ");
  const prompt = `Analyze the following meeting notes and extract a concise summary and a list of action items (tasks).
  
  Participants: ${participantsStr}
  Notes: "${notes}"
  
  Output JSON with 'summary' (string) and 'actionItems' (array of objects with 'description' and 'assignee'). 
  If no specific assignee is mentioned for a task, suggest one from the participants list or use 'Unassigned'.
  Language: French.`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            actionItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  assignee: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as MeetingSummaryResult;
    }
    return null;
  } catch (error) {
    console.error("Error generating summary:", error);
    return null;
  }
};
