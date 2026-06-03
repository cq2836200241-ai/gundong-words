import OpenAI from 'openai';

export interface WordEnrichmentResult {
  phonetic: string;
  part_of_speech: string;
  meaning: string;
  examples: Array<{ en: string; zh: string }>;
  synonyms: string[];
  antonyms: string[];
}

export class DeepSeekService {
  private client: OpenAI | null = null;

  init(apiKey: string, baseUrl: string = 'https://api.deepseek.com') {
    if (!apiKey) {
      this.client = null;
      return;
    }
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl,
      dangerouslyAllowBrowser: false
    });
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async enrichWord(word: string): Promise<WordEnrichmentResult | null> {
    if (!this.client) return null;

    const prompt = `
You are a professional English dictionary. For the word "${word}", provide:
{
  "phonetic": "IPA phonetic transcription",
  "part_of_speech": "part of speech (e.g., n. v. adj. adv.)",
  "meaning": "Chinese meaning (concise, max 15 characters)",
  "examples": [
    {"en": "Example sentence in English", "zh": "Chinese translation"},
    {"en": "Another example", "zh": "Chinese translation"}
  ],
  "synonyms": ["synonym1", "synonym2"],
  "antonyms": ["antonym1"]
}
Respond with ONLY the JSON object, no markdown wrappers, no other text.
`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return null;
      
      let cleanJson = content.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim();
      }

      return JSON.parse(cleanJson) as WordEnrichmentResult;
    } catch (e) {
      console.error(`DeepSeek API error for word ${word}:`, e);
      return null;
    }
  }
}

export const deepseekService = new DeepSeekService();
