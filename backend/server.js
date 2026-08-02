import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import process from 'process';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
}

app.use(cors());
app.use(express.json());

app.post('/api/ai-suggestion', async (req, res) => {
  try {
    const { conversationHistory = [] } = req.body || {};
    const openai = getOpenAIClient();

    if (!openai) {
      console.error('Missing OPENAI_API_KEY');
      return res.status(500).json({ error: 'AI service is not configured.' });
    }

    const prompt = `Tu es un assistant médical qui aide un docteur à répondre à un patient. Réponds de manière professionnelle, concise et chaleureuse. Historique récent du patient : ${conversationHistory
      .map((entry) => `- ${entry.sender}: ${entry.message}`)
      .join('\n') || 'Aucun message récent'}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant médical qui aide à rédiger des réponses professionnelles et rassurantes aux patients.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const suggestion = response.choices?.[0]?.message?.content?.trim();

    if (!suggestion) {
      return res.status(502).json({ error: 'No suggestion returned.' });
    }

    return res.json({ suggestion });
  } catch (error) {
    console.error('AI suggestion route error', error);
    return res.status(500).json({ error: 'Failed to generate suggestion.' });
  }
});

app.listen(port, () => {
  console.log(`AI backend listening on port ${port}`);
});
