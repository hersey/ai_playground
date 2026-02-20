import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.NOTION_API_KEY || process.env.NOTION_API_KEY === 'secret_xxx') {
  console.error('❌  NOTION_API_KEY is missing in .env');
  process.exit(1);
}
if (!process.env.NOTION_PARENT_PAGE_ID || process.env.NOTION_PARENT_PAGE_ID === 'xxx') {
  console.error('❌  NOTION_PARENT_PAGE_ID is missing in .env');
  console.error('    Open the Notion page where the databases should live,');
  console.error('    copy its ID from the URL, and paste it into .env.');
  process.exit(1);
}

const notion   = new Client({ auth: process.env.NOTION_API_KEY });
const parentId = process.env.NOTION_PARENT_PAGE_ID.trim();

async function createDB(title, titlePropName, extraProps) {
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentId },
    title: [{ type: 'text', text: { content: title } }],
    properties: {
      [titlePropName]: { title: {} },
      ...extraProps,
    },
  });
  return db.id;
}

console.log('\n🖊️  Scribe — creating Notion databases…\n');

try {
  // Only categorical fields as columns — free-text lives inside each page's body
  const ideasId = await createDB('Ideas', 'Title', {
    'Type': { select: {} },
    'Tags': { multi_select: {} },
  });
  console.log('✓  Ideas database created');

  const charactersId = await createDB('Characters', 'Name', {
    'Tags': { multi_select: {} },
  });
  console.log('✓  Characters database created');

  const storiesId = await createDB('Past Stories', 'What', {
    'Tags': { multi_select: {} },
  });
  console.log('✓  Past Stories database created');

  const randomId = await createDB('Random', 'Title', {
    'Tags': { multi_select: {} },
  });
  console.log('✓  Random database created');

  // Write IDs back to .env
  const envPath = path.join(__dirname, '.env');
  let env = fs.readFileSync(envPath, 'utf-8');

  const setEnv = (content, key, val) => {
    const line = `${key}=${val}`;
    return content.includes(key)
      ? content.replace(new RegExp(`${key}=.*`), line)
      : content + `\n${line}`;
  };

  env = setEnv(env, 'NOTION_IDEAS_DB_ID',      ideasId);
  env = setEnv(env, 'NOTION_CHARACTERS_DB_ID', charactersId);
  env = setEnv(env, 'NOTION_STORIES_DB_ID',    storiesId);
  env = setEnv(env, 'NOTION_RANDOM_DB_ID',     randomId);

  fs.writeFileSync(envPath, env);

  console.log('\n✅  Done! Database IDs written to .env');
  console.log('    Run `npm run dev` to start Scribe.\n');

} catch (err) {
  console.error('\n❌  Setup failed:', err.message);
  if (err.code === 'object_not_found' || err.status === 404) {
    console.error('\n    Could not find the parent page.');
    console.error('    Share it with your integration first:');
    console.error('    Open the page in Notion → ··· → Connections → invite your integration.\n');
  }
  process.exit(1);
}
