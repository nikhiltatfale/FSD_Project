// server.js - Feedback Analyzer Backend

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Sentiment = require('sentiment');
const path = require('path');

const app = express();
const sentiment = new Sentiment();
const PORT = 3000;

// In-memory storage for feedbacks
let feedbacks = [];

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// POST /submit-feedback - Analyze and store feedback
app.post('/submit-feedback', (req, res) => {
  const { name, email, rating, feedback } = req.body;

  // Validate required fields
  if (!name || !email || !rating || !feedback) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Analyze sentiment using sentiment package
  const result = sentiment.analyze(feedback);
  const score = result.score;

  // Classify sentiment based on score
  let sentimentLabel;
  if (score > 1) {
    sentimentLabel = 'Positive';
  } else if (score < -1) {
    sentimentLabel = 'Negative';
  } else {
    sentimentLabel = 'Neutral';
  }

  // Build feedback object
  const feedbackEntry = {
    id: Date.now(),
    name,
    email,
    rating: parseInt(rating),
    feedback,
    sentiment: sentimentLabel,
    score,
    timestamp: new Date().toISOString()
  };

  // Store in memory
  feedbacks.push(feedbackEntry);

  res.json({
    message: 'Feedback submitted successfully!',
    sentiment: sentimentLabel,
    score
  });
});

// GET /all-feedbacks - Return all stored feedbacks
app.get('/all-feedbacks', (req, res) => {
  res.json(feedbacks);
});

// GET /stats - Return sentiment counts
app.get('/stats', (req, res) => {
  const stats = {
    total: feedbacks.length,
    positive: feedbacks.filter(f => f.sentiment === 'Positive').length,
    neutral: feedbacks.filter(f => f.sentiment === 'Neutral').length,
    negative: feedbacks.filter(f => f.sentiment === 'Negative').length
  };
  res.json(stats);
});

// Start server
app.listen(PORT, () => {
  console.log(`Feedback Analyzer running at http://localhost:${PORT}`);
});