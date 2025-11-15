// server.js
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const movieRoutes = require('./routes/recommendationRoutes'); // Flask recommendations proxy

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB
const uri = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(uri);
let db;

async function connectToMongo() {
  try {
    await client.connect();
    console.log('Connected to MongoDB ✅');
    db = client.db('movies');

    const count = await db.collection('tmdb1million').countDocuments({});
    console.log(`Found ${count} movies in the database`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}
connectToMongo();

// GET /api/movies  optional ?genre=Drama
app.get('/api/movies', async (req, res) => {
  try {
    const { genre } = req.query;
    const col = db.collection('tmdb1million');

    // Home feed
    if (!genre) {
      const movies = await col.find({}).limit(20).toArray();
      return res.json({ movies });
    }

    if (genre.toLowerCase() === 'unknown genre') {
      return res.json({ movies: [] });
    }

    // Instant indexed lookup on the multikey index
    const movies = await col
      .find({ genres_tokens: genre })
      .limit(50)
      .toArray();

    return res.json({ movies });
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/movies/search?query=Inception
app.get('/api/movies/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const movies = await db
      .collection('tmdb1million')
      .find({
        title: { $regex: query, $options: 'i' }
      })
      .limit(100)
      .toArray();

    res.json({ movies });
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/movies/random
app.get('/api/movies/random', async (req, res) => {
  try {
    const filter = {
      poster_path: { $ne: null },
      vote_average: { $gte: 6.0 }
    };

    const col = db.collection('tmdb1million');
    const count = await col.countDocuments(filter);
    if (count === 0) {
      return res.status(404).json({ error: 'No movies found' });
    }

    const randomIndex = Math.floor(Math.random() * count);
    const randomMovie = await col.find(filter).skip(randomIndex).limit(1).toArray();

    if (randomMovie.length) {
      return res.json({ movie: randomMovie[0] });
    }
    res.status(404).json({ error: 'No movie found' });
  } catch (error) {
    console.error('Error fetching random movie:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/movie/:id
app.get('/api/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await db.collection('tmdb1million').findOne({
      _id: new ObjectId(id)
    });

    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json({ movie });
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test route
app.get('/api/test-db', async (req, res) => {
  try {
    const sampleMovie = await db.collection('tmdb1million').findOne({});
    if (!sampleMovie) return res.status(404).json({ error: 'No movies found in collection' });
    res.json({ message: 'Database connection successful!', sampleMovie, fields: Object.keys(sampleMovie) });
  } catch (error) {
    console.error('Error testing database:', error);
    res.status(500).json({ error: error.message });
  }
});

// Recommendations proxy to Flask
app.use('/api', movieRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
