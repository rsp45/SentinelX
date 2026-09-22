import { generateText } from 'ai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  try {
    const { text } = await generateText({
      model: 'openai/gpt-5.5',
      prompt: 'Invent a new holiday and describe its traditions.',
    });

    console.log(text);
  } catch (error: any) {
    console.error('Error generating text:', error?.message || error);
  }
}

main();

