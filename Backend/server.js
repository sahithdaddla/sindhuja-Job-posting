const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();
const port = 3206;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection configuration
const pool = new Pool({
    user: 'postgres', // Replace with your PostgreSQL username
    host: 'postgres',
    database: 'job_portal',
    password: 'admin123', // Replace with your PostgreSQL password
    port: 5432,
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err.stack);
        return;
    }
    console.log('Connected to PostgreSQL database');
    release();
});

// API to get all jobs with optional filtering
app.get('/api/jobs', async (req, res) => {
    try {
        const { search, jobType, location } = req.query;
        let query = 'SELECT * FROM jobs WHERE 1=1';
        const values = [];
        let paramIndex = 1;

        if (search) {
            query += ` AND (title ILIKE $${paramIndex} OR location ILIKE $${paramIndex} OR EXISTS (SELECT 1 FROM unnest(skills) AS skill WHERE skill ILIKE $${paramIndex}))`;
            values.push(`%${search}%`);
            paramIndex++;
        }

        if (jobType) {
            query += ` AND type = $${paramIndex}`;
            values.push(jobType);
            paramIndex++;
        }

        if (location) {
            query += ` AND location = $${paramIndex}`;
            values.push(location);
            paramIndex++;
        }

        query += ' ORDER BY posted_date DESC';

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching jobs:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// API to get a single job by ID
app.get('/api/jobs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching job:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// API to create a new job
app.post('/api/jobs', async (req, res) => {
    try {
        console.log('Received payload:', req.body); // Log incoming data for debugging
        const {
            title, type, description, skills, location, deadline, postedDate, salaryMin, salaryMax
        } = req.body;

        // Basic validation
        if (!title || !type || !description || !skills || !location || !deadline || !postedDate) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        if (!Array.isArray(skills)) {
            return res.status(400).json({ error: 'Skills must be an array' });
        }

        // Validate salary inputs
        if (salaryMin < 0 || salaryMax < 0 || salaryMax < salaryMin) {
            return res.status(400).json({ error: 'Invalid salary range' });
        }

        const query = `
            INSERT INTO jobs (title, type, description, skills, location, deadline, posted_date, salary_min, salary_max)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        const values = [
            title, type, description, skills, location, deadline, postedDate, salaryMin, salaryMax
        ];

        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating job:', err.message, err.stack);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://13.51.205.49:${port}`);
});