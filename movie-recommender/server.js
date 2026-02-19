import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const OMDB_API_KEY = process.env.OMDB_API_KEY;

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

app.post('/api/recommend', async (req, res) => {
  const { movieTitle } = req.body;
  if (!movieTitle?.trim()) {
    return res.status(400).json({ error: 'Movie title is required' });
  }

  try {
    // Fetch seed movie from OMDB
    const seedOMDB = await fetchFromOMDB(movieTitle);
    const seedYear = seedOMDB?.Year?.match(/\d{4}/)?.[0] || '';

    // Ask Claude for recommendations
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2500,
      system: 'You are a passionate cinephile and film critic with encyclopedic knowledge of world cinema across all eras and genres. You give thoughtful, specific recommendations grounded in real cinematic connections.',
      messages: [{
        role: 'user',
        content: `Recommend exactly 10 movies for someone who loves "${movieTitle}"${seedYear ? ` (${seedYear})` : ''}.

For each recommendation:
- Write 2–3 sentences explaining the specific connection — reference themes, directorial style, emotional tone, narrative structure, or visual language bridging both films.
- List the major streaming platforms where this movie is currently available (e.g. Netflix, Amazon Prime Video, Max, Hulu, Disney+, Apple TV+, Paramount+, Peacock). Only list platforms you are confident about. Use an empty array if unsure.
- List any specific Academy Award (Oscar) categories this film won (e.g. ["Best Picture", "Best Director"]). Use an empty array if it won none.

Respond ONLY with a raw JSON array (no markdown, no code fences):
[{"title":"Exact Movie Title","year":"YYYY","reason":"Specific, insightful reason.","streaming":["Netflix","Max"],"oscarWins":["Best Picture","Best Director"]}]`,
      }],
    });

    let recommendations;
    const text = message.content[0].text.trim();
    try {
      recommendations = JSON.parse(text);
    } catch {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) recommendations = JSON.parse(match[0]);
      else throw new Error('Could not parse AI response as JSON');
    }

    // Fetch all metadata in parallel
    const [seedData, ...recData] = await Promise.all([
      Promise.resolve(seedOMDB ? parseOMDB(seedOMDB) : { title: movieTitle }),
      ...recommendations.map(async (rec) => {
        const omdb = await fetchFromOMDB(rec.title, rec.year);
        return {
          reason: rec.reason,
          streaming: rec.streaming || [],
          oscarWins: rec.oscarWins || [],
          ...(omdb ? parseOMDB(omdb) : { title: rec.title, year: rec.year }),
        };
      }),
    ]);

    res.json({ seed: seedData, recommendations: recData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to get recommendations' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CineMatch running → http://localhost:${PORT}`));
