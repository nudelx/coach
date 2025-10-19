const OpenAI = require('openai');
const { getEnvVar } = require('./env');

const getClient = () => {
  const apiKey = getEnvVar('OPENAI_API_KEY');
  return new OpenAI({ apiKey });
};

const completeLessonPlan = async (prompt) => {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: 'You are a certified ESL teacher who creates kid-friendly lesson plans with practical classroom detail.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const choice = response.choices[0];
  if (!choice || !choice.message || !choice.message.content) {
    throw new Error('OpenAI response did not include lesson content.');
  }
  return choice.message.content.trim();
};

module.exports = {
  completeLessonPlan,
};
