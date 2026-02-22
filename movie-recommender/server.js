import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const OMDB_API_KEY = process.env.OMDB_API_KEY;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const MOVIES_TAB = 'Movies';
const TV_TAB = 'TV';
// Movies: Name, Status, Year, Director, Lead Actors, Genre, Academy Awards, Tags, IMDb, RT  (A–J)
// TV:     Name, Status, Year, Lead Actors, Genre, Emmy Awards, Tags, IMDb, RT             (A–I)
const MOVIES_HEADERS = ['Name', 'Status', 'Year', 'Director', 'Lead Actors', 'Genre', 'Academy Awards', 'Tags', 'IMDb', 'RT'];
const TV_HEADERS    = ['Name', 'Status', 'Year', 'Lead Actors', 'Genre', 'Emmy Awards', 'Tags', 'IMDb', 'RT'];
const TAB_HEADERS   = { [MOVIES_TAB]: MOVIES_HEADERS, [TV_TAB]: TV_HEADERS };
const LAST_COL      = { [MOVIES_TAB]: 'J', [TV_TAB]: 'I' };
const TAG_COL       = { [MOVIES_TAB]: 'H', [TV_TAB]: 'G' };

// ── Google Sheets setup ─────────────────────────────────────
let sheets = null;
let sheetReady = false;

async function initSheets() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !SHEET_ID) {
    console.log('Google Sheets not configured (missing env vars) — watchlist disabled');
    return;
  }
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    sheets = google.sheets({ version: 'v4', auth });
    await setupSheetIfNeeded();
    sheetReady = true;
    console.log('Google Sheets connected ✓');
  } catch (err) {
    console.warn('Google Sheets init failed:', err.message);
  }
}

async function setupSheetIfNeeded() {
  // Get all existing sheets
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existingNames = meta.data.sheets.map(s => s.properties.title);

  // Create tabs if missing
  const tabsToCreate = [MOVIES_TAB, TV_TAB].filter(t => !existingNames.includes(t));
  if (tabsToCreate.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: tabsToCreate.map(title => ({ addSheet: { properties: { title } } })),
      },
    });
  }

  // Set up headers + validation for each tab
  for (const tab of [MOVIES_TAB, TV_TAB]) {
    const lastCol = LAST_COL[tab];
    const tabHeaders = TAB_HEADERS[tab];
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${tab}!A1:${lastCol}1`,
    });
    const existing = res.data.values?.[0];
    const expectedLast = tab === MOVIES_TAB ? 'RT' : 'RT';
    const expectedLastIdx = tab === MOVIES_TAB ? 9 : 8;
    // Skip if headers already correct
    if (existing?.[0] === 'Name' && existing?.[expectedLastIdx] === expectedLast &&
        (tab === MOVIES_TAB ? existing?.[3] === 'Director' : existing?.[3] === 'Lead Actors')) continue;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${tab}!A1:${lastCol}1`,
      valueInputOption: 'RAW',
      requestBody: { values: [tabHeaders] },
    });

    // Get sheet ID for data validation
    const meta2 = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const sheetId = meta2.data.sheets.find(s => s.properties.title === tab)?.properties.sheetId;
    if (sheetId == null) continue;

    const statusRange = { sheetId, startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 1, endColumnIndex: 2 };
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          // Dropdown validation
          {
            setDataValidation: {
              range: statusRange,
              rule: {
                condition: {
                  type: 'ONE_OF_LIST',
                  values: [{ userEnteredValue: 'Not Watched' }, { userEnteredValue: 'Watched' }],
                },
                showCustomUi: true,
                strict: true,
              },
            },
          },
          // Red for "Not Watched"
          {
            addConditionalFormatRule: {
              rule: {
                ranges: [statusRange],
                booleanRule: {
                  condition: { type: 'TEXT_EQ', values: [{ userEnteredValue: 'Not Watched' }] },
                  format: { backgroundColor: { red: 0.957, green: 0.800, blue: 0.800 } },
                },
              },
              index: 0,
            },
          },
          // Green for "Watched"
          {
            addConditionalFormatRule: {
              rule: {
                ranges: [statusRange],
                booleanRule: {
                  condition: { type: 'TEXT_EQ', values: [{ userEnteredValue: 'Watched' }] },
                  format: { backgroundColor: { red: 0.851, green: 0.918, blue: 0.827 } },
                },
              },
              index: 1,
            },
          },
        ],
      },
    });
  }
}

// ── Emmy info from Wikipedia ─────────────────────────────────
async function fetchEmmyInfo(title, year) {
  try {
    const query = encodeURIComponent(`${title} TV series`);
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&format=json&srlimit=3&origin=*`,
      { signal: AbortSignal.timeout(5000) }
    );
    const searchData = await searchRes.json();
    const firstPage = searchData.query?.search?.[0];
    if (!firstPage) return null;

    const pageTitle = encodeURIComponent(firstPage.title);
    const extractRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${pageTitle}&prop=extracts&exintro=1&format=json&origin=*&explaintext=1`,
      { signal: AbortSignal.timeout(5000) }
    );
    const extractData = await extractRes.json();
    const pages = extractData.query?.pages || {};
    const extract = Object.values(pages)[0]?.extract || '';

    const wonMatch = extract.match(/won (\d+) (primetime )?emmy award/i);
    if (wonMatch) {
      const n = wonMatch[1];
      return `Won ${n} Primetime Emmy Award${n !== '1' ? 's' : ''}`;
    }
    const nomMatch = extract.match(/nominated for (\d+) (primetime )?emmy/i);
    if (nomMatch) {
      const n = nomMatch[1];
      return `${n} Primetime Emmy nomination${n !== '1' ? 's' : ''}`;
    }
    return null;
  } catch {
    return null;
  }
}

// ── OMDB helpers ────────────────────────────────────────────
async function fetchFromOMDB(title, year = '') {
  const params = new URLSearchParams({
    t: title,
    apikey: OMDB_API_KEY,
    plot: 'short',
    ...(year && { y: year }),
  });
  try {
    const res = await fetch(`http://www.omdbapi.com/?${params}`);
    const data = await res.json();
    return data.Response === 'True' ? data : null;
  } catch {
    return null;
  }
}

function parseOMDB(data) {
  if (!data) return {};
  const rt = data.Ratings?.find(r => r.Source === 'Rotten Tomatoes');
  return {
    title: data.Title,
    year: data.Year,
    type: data.Type || 'movie', // 'movie', 'series', 'episode'
    poster: data.Poster !== 'N/A' ? data.Poster : null,
    synopsis: data.Plot !== 'N/A' ? data.Plot : null,
    genre: data.Genre !== 'N/A' ? data.Genre.split(', ') : [],
    director: data.Director !== 'N/A' ? data.Director : null,
    runtime: data.Runtime !== 'N/A' ? data.Runtime : null,
    imdbRating: data.imdbRating !== 'N/A' ? data.imdbRating : null,
    rtRating: rt ? rt.Value : null,
    imdbId: data.imdbID || null,
    actors: data.Actors !== 'N/A' ? data.Actors : null,
    awards: data.Awards !== 'N/A' ? data.Awards : null,
  };
}

function tabForType(type) {
  return (type === 'series' || type === 'episode') ? TV_TAB : MOVIES_TAB;
}

// ── Recommend endpoint ──────────────────────────────────────
app.post('/api/recommend', async (req, res) => {
  const { query, excludeTitles = [] } = req.body;
  if (!query?.trim()) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const excludeClause = excludeTitles.length > 0
      ? `\nDo NOT recommend any of these titles: ${excludeTitles.join(', ')}.`
      : '';

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2800,
      system: 'You are a passionate cinephile and film critic with encyclopedic knowledge of world cinema across all eras and genres. You give thoughtful, specific recommendations grounded in real cinematic connections.',
      messages: [{
        role: 'user',
        content: `Analyze this natural language movie/TV query: "${query}"${excludeClause}

1. If the query mentions a specific existing movie or TV show by name as a reference point, extract it as seedTitle (exact title) and seedYear (4-digit year if you know it, else null). If no specific title is named, set seedTitle to null and seedYear to null.
2. Summarize the query intent in 4–8 words as queryLabel (e.g. "Dark psychological thrillers with unreliable narrator").
3. Recommend exactly 10 movies or TV shows matching the query. For each:
   - One sentence (max 25 words) explaining the specific connection to the query's themes, tone, or style.
   - List streaming platforms where currently available (Netflix, Amazon Prime Video, Max, Hulu, Disney+, Apple TV+, Paramount+, Peacock). Use [] if unsure.
   - List Oscar categories won. Use [] if none.

Respond ONLY with raw JSON (no markdown, no code fences):
{"seedTitle":"Movie Title or null","seedYear":"1994 or null","queryLabel":"4-8 word label","recommendations":[{"title":"...","year":"YYYY","reason":"...","streaming":[...],"oscarWins":[...]}]}`,
      }],
    });

    let parsed;
    const text = message.content[0].text.trim();
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error('Could not parse AI response as JSON');
    }

    const { seedTitle, seedYear, queryLabel, recommendations } = parsed;

    // Fetch seed from OMDB if Claude identified one
    const seedOMDB = seedTitle ? await fetchFromOMDB(seedTitle, seedYear || '') : null;
    const seed = seedOMDB ? parseOMDB(seedOMDB) : (seedTitle ? { title: seedTitle } : null);

    // Fetch recommendation metadata in parallel
    const recData = await Promise.all(
      recommendations.map(async (rec) => {
        const omdb = await fetchFromOMDB(rec.title, rec.year);
        return {
          reason: rec.reason,
          streaming: rec.streaming || [],
          oscarWins: rec.oscarWins || [],
          ...(omdb ? parseOMDB(omdb) : { title: rec.title, year: rec.year }),
        };
      })
    );

    res.json({ seed, queryLabel, recommendations: recData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to get recommendations' });
  }
});

// ── Watchlist endpoints ─────────────────────────────────────
app.get('/api/watchlist', async (req, res) => {
  if (!sheetReady) return res.json([]);
  try {
    const results = [];
    for (const tab of [MOVIES_TAB, TV_TAB]) {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${tab}!A:${LAST_COL[tab]}`,
      });
      const rows = response.data.values || [];
      if (rows.length <= 1) continue;
      const [, ...data] = rows;
      data
        .filter(row => row[0])
        .forEach((row, i) => {
          if (tab === MOVIES_TAB) {
            // A=Name B=Status C=Year D=Director E=Actors F=Genre G=Awards H=Tags I=IMDb J=RT
            results.push({
              rowIndex: i + 2, tab,
              title: row[0] || '', status: row[1] || 'Not Watched',
              year: row[2] || '', director: row[3] || '', actors: row[4] || '',
              genre: row[5] || '', awards: row[6] || '', tag: row[7] || '',
              imdbRating: row[8] || '', rtRating: row[9] || '',
            });
          } else {
            // A=Name B=Status C=Year D=Actors E=Genre F=Emmy Awards G=Tags H=IMDb I=RT
            results.push({
              rowIndex: i + 2, tab,
              title: row[0] || '', status: row[1] || 'Not Watched',
              year: row[2] || '', director: '', actors: row[3] || '',
              genre: row[4] || '', awards: row[5] || '', tag: row[6] || '',
              imdbRating: row[7] || '', rtRating: row[8] || '',
            });
          }
        });
    }
    res.json(results);
  } catch (err) {
    console.error('Watchlist GET error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/watchlist', async (req, res) => {
  if (!sheetReady) return res.status(503).json({ error: 'Watchlist not configured — add Google Sheets credentials to .env' });
  try {
    const { title, year, director, genre, awards, actors, type, imdbRating, rtRating } = req.body;
    const tab = tabForType(type);
    const isTv = tab === TV_TAB;

    // For TV shows, try to fetch Emmy info from Wikipedia
    let finalAwards = awards || '';
    if (isTv) {
      const emmyInfo = await fetchEmmyInfo(title, year);
      if (emmyInfo) finalAwards = emmyInfo;
    }

    // Movies: Name,Status,Year,Director,Actors,Genre,Awards,Tags,IMDb,RT
    // TV:     Name,Status,Year,Actors,Genre,Emmy,Tags,IMDb,RT
    const values = isTv
      ? [title || '', 'Not Watched', year || '', actors || '', genre || '', finalAwards, '', imdbRating || '', rtRating || '']
      : [title || '', 'Not Watched', year || '', director || '', actors || '', genre || '', finalAwards, '', imdbRating || '', rtRating || ''];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${tab}!A:${LAST_COL[tab]}`,
      valueInputOption: 'RAW',
      requestBody: { values: [values] },
    });
    res.json({ success: true, tab });
  } catch (err) {
    console.error('Watchlist POST error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/watchlist/:rowIndex', async (req, res) => {
  if (!sheetReady) return res.status(503).json({ error: 'Watchlist not configured' });
  try {
    const { rowIndex } = req.params;
    const { status, tag, tab } = req.body;
    const sheetTab = tab || MOVIES_TAB;

    if (status !== undefined) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetTab}!B${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[status]] },
      });
    }
    if (tag !== undefined) {
      const tagCol = TAG_COL[sheetTab] || 'H';
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetTab}!${tagCol}${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[tag]] },
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Watchlist PATCH error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/watchlist/:rowIndex', async (req, res) => {
  if (!sheetReady) return res.status(503).json({ error: 'Watchlist not configured' });
  try {
    const rowIndex = parseInt(req.params.rowIndex);
    const { tab } = req.query;
    const sheetTab = tab || MOVIES_TAB;

    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const sheetId = meta.data.sheets.find(s => s.properties.title === sheetTab)?.properties.sheetId;
    if (sheetId == null) throw new Error(`Tab "${sheetTab}" not found`);

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        }],
      },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Watchlist DELETE error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
initSheets().then(() => {
  app.listen(PORT, () => console.log(`Marquee running → http://localhost:${PORT}`));
});
