const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');

        res.send(
            'Backend running! PostgreSQL connected successfully: ' +
            result.rows[0].now
        );
    } catch (error) {
        console.error('Database error:', error.message);
        res.status(500).send(
            'Database connection failed. Check the VS Code terminal.'
        );
    }
});

app.get('/api/db-test', async (req, res) => {
    try {
        await pool.query('SELECT NOW()');
        res.send('PostgreSQL connected successfully!');
    } catch (error) {
        console.error('Database error:', error.message);
        res.status(500).send('Database connection failed.');
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});