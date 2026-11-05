
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'online_assessment',
});

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, salt, storedHash) {
  const actualHash = Buffer.from(hashPassword(password, salt), 'hex');
  const expectedHash = Buffer.from(storedHash, 'hex');

  return actualHash.length === expectedHash.length &&
    crypto.timingSafeEqual(actualHash, expectedHash);
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(30) NOT NULL DEFAULT 'Student',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS assessment_attempts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES app_users(id) ON DELETE SET NULL,
      assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      student_name VARCHAR(150) NOT NULL DEFAULT 'Guest',
      score NUMERIC(10,2) NOT NULL DEFAULT 0,
      total_marks NUMERIC(10,2) NOT NULL DEFAULT 0,
      percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
      correct_answers INTEGER NOT NULL DEFAULT 0,
      total_questions INTEGER NOT NULL DEFAULT 0,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Authentication and assessment history tables are ready.');
}

app.get('/', (req, res) => {
  res.json({ message: 'QuizMaster backend is running!' });
});

app.get('/api/auth/register', (req, res) => {
  res.json({ message: 'AUTH ROUTE REACHED' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password ||
        !String(name).trim() || !String(email).trim()) {
      return res.status(400).json({
        message: 'Name, email and password are required.',
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        message: 'Password must contain at least 6 characters.',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(name).trim();
    const normalizedRole =
      String(role || 'Student').toLowerCase() === 'admin'
        ? 'Admin'
        : 'Student';

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(String(password), salt);

    const result = await pool.query(
      `INSERT INTO app_users
       (name, email, password_salt, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role`,
      [normalizedName, normalizedEmail, salt, passwordHash, normalizedRole]
    );

    res.status(201).json({
      message: 'Registration successful.',
      user: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        message: 'This email is already registered.',
      });
    }

    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.',
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, role, password_salt, password_hash
       FROM app_users WHERE email = $1`,
      [String(email).trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    if (!verifyPassword(String(password), user.password_salt, user.password_hash)) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    res.json({ message: 'Login successful.', user: publicUser(user) });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// GET ALL ASSESSMENTS
app.get('/api/assessments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, duration_minutes, total_marks
       FROM assessments ORDER BY id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get assessments error:', error.message);
    res.status(500).json({ message: 'Could not load assessments.' });
  }
});

// CREATE ASSESSMENT
app.post('/api/assessments', async (req, res) => {
  try {
    const { title, description, duration_minutes, total_marks } = req.body;
    const duration = Number(duration_minutes);
    const marks = Number(total_marks);

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Assessment title is required.' });
    }

    if (!Number.isInteger(duration) || duration < 1 ||
        !Number.isFinite(marks) || marks <= 0) {
      return res.status(400).json({
        message: 'Enter a valid duration and total marks.',
      });
    }

    const result = await pool.query(
      `INSERT INTO assessments
       (title, description, duration_minutes, total_marks)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, description, duration_minutes, total_marks`,
      [String(title).trim(), description || '', duration, marks]
    );

    res.status(201).json({
      message: 'Assessment created successfully.',
      assessment: result.rows[0],
    });
  } catch (error) {
    console.error('Create assessment error:', error.message);
    res.status(500).json({ message: 'Could not create assessment.' });
  }
});

// GET QUESTIONS
app.get('/api/assessments/:id/questions', async (req, res) => {
  try {
    const assessmentId = Number(req.params.id);

    if (!Number.isInteger(assessmentId) || assessmentId < 1) {
      return res.status(400).json({ message: 'Invalid assessment ID.' });
    }

    const assessment = await pool.query(
      'SELECT id FROM assessments WHERE id = $1',
      [assessmentId]
    );

    if (!assessment.rows.length) {
      return res.status(404).json({ message: 'Assessment not found.' });
    }

    const result = await pool.query(
      `SELECT q.id, q.question_text, q.question_type, q.marks,
        COALESCE(
          json_agg(json_build_object('id', o.id, 'option_text', o.option_text)
          ORDER BY o.id) FILTER (WHERE o.id IS NOT NULL),
          '[]'::json
        ) AS options
       FROM questions q
       LEFT JOIN question_options o ON o.question_id = q.id
       WHERE q.assessment_id = $1
       GROUP BY q.id, q.question_text, q.question_type, q.marks
       ORDER BY q.id`,
      [assessmentId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get questions error:', error.message);
    res.status(500).json({ message: 'Could not load questions.' });
  }
});

// ADD QUESTION
app.post('/api/assessments/:id/questions', async (req, res) => {
  const client = await pool.connect();

  try {
    const assessmentId = Number(req.params.id);
    const {
      question_text,
      question_type,
      marks,
      options,
      correct_answer,
    } = req.body;

    if (!Number.isInteger(assessmentId) || assessmentId < 1 ||
        !question_text || !String(question_text).trim()) {
      return res.status(400).json({
        message: 'Valid assessment ID and question text are required.',
      });
    }

    const rawType = String(question_type || 'MCQ').toUpperCase();
    const questionType = rawType === 'MCQ' ? 'mcq' : 'true_false';
    const questionMarks = Number(marks || 1);

    if (!['MCQ', 'TRUE_FALSE', 'TRUE/FALSE'].includes(rawType) ||
        !Number.isFinite(questionMarks) || questionMarks <= 0) {
      return res.status(400).json({ message: 'Invalid question type or marks.' });
    }

    await client.query('BEGIN');

    const assessment = await client.query(
      'SELECT id FROM assessments WHERE id = $1',
      [assessmentId]
    );

    if (!assessment.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Assessment not found.' });
    }

    const inserted = await client.query(
      `INSERT INTO questions
       (assessment_id, question_text, question_type, marks)
       VALUES ($1, $2, $3, $4)
       RETURNING id, question_text, question_type, marks`,
      [assessmentId, String(question_text).trim(), questionType, questionMarks]
    );

    const question = inserted.rows[0];

    for (const option of (Array.isArray(options) ? options : [])) {
      const optionText = typeof option === 'string'
        ? option
        : option?.option_text ?? option?.text;

      if (!optionText) continue;

      const isCorrect = typeof option === 'object' && option !== null
        ? Boolean(option.is_correct)
        : String(optionText) === String(correct_answer);

      await client.query(
        `INSERT INTO question_options (question_id, option_text, is_correct)
         VALUES ($1, $2, $3)`,
        [question.id, String(optionText), isCorrect]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Question added successfully.', question });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add question error:', error.message);
    res.status(500).json({ message: 'Could not add question.' });
  } finally {
    client.release();
  }
});

// SUBMIT ASSESSMENT AND SAVE RESULT
app.post('/api/assessments/:id/submit', async (req, res) => {
  try {
    const assessmentId = Number(req.params.id);
    const answers = req.body.answers || {};
    const userId = req.body.user_id ? Number(req.body.user_id) : null;
    const studentName = String(req.body.student_name || 'Guest').trim() || 'Guest';

    if (!Number.isInteger(assessmentId) || assessmentId < 1) {
      return res.status(400).json({ message: 'Invalid assessment ID.' });
    }

    if (userId !== null && (!Number.isInteger(userId) || userId < 1)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }

    const assessmentResult = await pool.query(
      'SELECT id, title FROM assessments WHERE id = $1',
      [assessmentId]
    );

    if (!assessmentResult.rows.length) {
      return res.status(404).json({ message: 'Assessment not found.' });
    }

    const questionResult = await pool.query(
      `SELECT q.id, q.question_text, q.marks, q.question_type,
        COALESCE(
          json_agg(json_build_object(
            'id', o.id, 'option_text', o.option_text, 'is_correct', o.is_correct
          ) ORDER BY o.id) FILTER (WHERE o.id IS NOT NULL),
          '[]'::json
        ) AS options
       FROM questions q
       LEFT JOIN question_options o ON o.question_id = q.id
       WHERE q.assessment_id = $1
       GROUP BY q.id, q.question_text, q.marks, q.question_type
       ORDER BY q.id`,
      [assessmentId]
    );

    let score = 0;
    let totalMarks = 0;
    let correctCount = 0;

    const answerList = Array.isArray(answers)
      ? answers
      : Object.entries(answers).map(([questionId, answer]) => ({
          question_id: questionId,
          answer,
        }));

    const results = questionResult.rows.map((question) => {
      const marks = Number(question.marks) || 0;
      totalMarks += marks;

      const submitted = answerList.find((item) =>
        String(item.question_id ?? item.questionId ?? item.id) === String(question.id)
      );

      const selectedAnswer = submitted?.answer ??
        submitted?.selected_answer ??
        submitted?.option_id ??
        submitted?.selected_option_id ??
        submitted?.selectedOptionId ??
        null;

      const correctOption = question.options.find((option) => option.is_correct === true);

      const isCorrect = question.options.some((option) =>
        option.is_correct === true &&
        (
          String(option.id) === String(selectedAnswer) ||
          String(option.option_text).trim().toLowerCase() ===
            String(selectedAnswer ?? '').trim().toLowerCase()
        )
      );

      if (isCorrect) {
        score += marks;
        correctCount++;
      }

      return {
        question_id: question.id,
        question_text: question.question_text,
        selected_answer: selectedAnswer,
        correct_answer: correctOption?.option_text ?? 'Not configured',
        is_correct: isCorrect,
        marks_awarded: isCorrect ? marks : 0,
        total_question_marks: marks,
      };
    });

    const percentage = totalMarks > 0
      ? Math.round((score / totalMarks) * 100)
      : 0;

    const saved = await pool.query(
      `INSERT INTO assessment_attempts
       (user_id, assessment_id, student_name, score, total_marks,
        percentage, correct_answers, total_questions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, completed_at`,
      [
        userId,
        assessmentId,
        studentName,
        score,
        totalMarks,
        percentage,
        correctCount,
        questionResult.rows.length,
      ]
    );

    res.json({
      message: 'Assessment submitted successfully.',
      attempt_id: saved.rows[0].id,
      completed_at: saved.rows[0].completed_at,
      assessment: assessmentResult.rows[0].title,
      score,
      total_marks: totalMarks,
      percentage,
      correct_answers: correctCount,
      total_questions: questionResult.rows.length,
      results,
    });
  } catch (error) {
    console.error('Submit assessment error:', error.message);
    res.status(500).json({ message: 'Could not submit assessment.' });
  }
});

// ASSESSMENT HISTORY
app.get('/api/assessment-history', async (req, res) => {
  try {
    const userId = req.query.user_id ? Number(req.query.user_id) : null;

    let query = `
      SELECT aa.id, aa.user_id, aa.student_name, aa.assessment_id,
             a.title AS assessment_title, aa.score, aa.total_marks,
             aa.percentage, aa.correct_answers, aa.total_questions,
             aa.completed_at
      FROM assessment_attempts aa
      JOIN assessments a ON a.id = aa.assessment_id`;

    const params = [];

    if (userId !== null) {
      if (!Number.isInteger(userId) || userId < 1) {
        return res.status(400).json({ message: 'Invalid user ID.' });
      }
      query += ' WHERE aa.user_id = $1';
      params.push(userId);
    }

    query += ' ORDER BY aa.completed_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Assessment history error:', error.message);
    res.status(500).json({ message: 'Could not load assessment history.' });
  }
});

// LEADERBOARD
app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(u.name, aa.student_name, 'Guest') AS student_name,
        COUNT(*) AS assessments_completed,
        ROUND(AVG(aa.percentage), 2) AS average_percentage,
        MAX(aa.percentage) AS best_percentage,
        SUM(aa.score) AS total_score
      FROM assessment_attempts aa
      LEFT JOIN app_users u ON u.id = aa.user_id
      GROUP BY COALESCE(u.id::text, aa.student_name)
        , COALESCE(u.name, aa.student_name, 'Guest')
      ORDER BY average_percentage DESC, total_score DESC
      LIMIT 100
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Leaderboard error:', error.message);
    res.status(500).json({ message: 'Could not load leaderboard.' });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('PostgreSQL connected successfully.');
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log('Backend server started successfully.');
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Backend startup error:', error.message);
    process.exit(1);
  }
}

startServer();
