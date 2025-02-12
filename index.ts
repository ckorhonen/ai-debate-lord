// c:\Users\yepis\dev\llm-dialog\index.ts
import { loadSystemPrompts } from './src/config';
import { runConversationUnified } from './src/conversation';
import { promises as fs } from 'fs';

async function main() {
  await loadSystemPrompts();

  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: ts-node index.ts "<initial message>" <number_of_turns> [--file <file_path>]');
    process.exit(1);
  }

  let initialMessage = args[0];
  const turns = parseInt(args[1], 10);

  if (isNaN(turns) || turns <= 0) {
    console.error('The number of turns must be a positive integer.');
    process.exit(1);
  }

  const fileFlagIndex = args.indexOf('--file');
  if (fileFlagIndex !== -1 && args[fileFlagIndex + 1]) {
    const filePath = args[fileFlagIndex + 1];
    try {
      initialMessage = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error(`Error reading file at ${filePath}:`, error);
      process.exit(1);
    }
  }

  await runConversationUnified(initialMessage, turns);
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
