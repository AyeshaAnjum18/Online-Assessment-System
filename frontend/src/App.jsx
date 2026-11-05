import { useEffect, useRef, useState } from 'react';
import Auth from './pages/Auth';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import {
  ClipboardList,
  FileCheck,
  TrendingUp,
  Clock,
  BookOpen,
  Play,
  CheckCircle,
  ArrowLeft,
  LogOut,
  Plus,
  Trash2,
} from 'lucide-react';

const API_URL = 'http://localhost:5000';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('quizmaster_user')) || null;
    } catch {
      return null;
    }
  });

  const [assessments, setAssessments] = useState([]);
  const [page, setPage] = useState('Dashboard');
  const [selected, setSelected] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const submissionLock = useRef(false);
  const submitAssessmentRef = useRef(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(15);
  const [totalMarks, setTotalMarks] = useState(10);
  const [newQuestions, setNewQuestions] = useState([
    {
      question_text: '',
      question_type: 'MCQ',
      marks: 2,
      options: ['', '', '', ''],
      correct_answer: '',
    },
  ]);

  const buttonClass =
    'rounded-lg bg-[#718F6D] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#5E795A] disabled:cursor-not-allowed disabled:opacity-50';

  const inputClass =
    'w-full rounded-lg border border-[#E1E9DD] bg-white px-4 py-3 text-[#718071] outline-none focus:border-[#718F6D] focus:ring-2 focus:ring-[#E1E9DD]';

  const cardClass =
    'rounded-xl border border-[#E1E9DD] bg-white p-5 shadow-sm';

  async function loadAssessments() {
    try {
      const response = await fetch(`${API_URL}/api/assessments`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setAssessments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Could not load assessments.');
    }
  }

  async function loadHistory() {
    if (!user?.id) {
      setHistory([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/assessment-history?user_id=${encodeURIComponent(user.id)}`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not load attempt history.');
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Could not load attempt history.');
    }
  }

  async function loadLeaderboard() {
    try {
      const response = await fetch(`${API_URL}/api/leaderboard`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not load leaderboard.');
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Could not load leaderboard.');
    }
  }

  useEffect(() => {
    if (page === 'Attempt History' || page === 'History') loadHistory();
    if (page === 'Leaderboard') loadLeaderboard();
  }, [page, user?.id]);

  useEffect(() => {
    if (page === 'Dashboard' || page === 'Assessments') {
      loadAssessments();
    }
  }, [page]);

  useEffect(() => {
    const handleNavigation = (event) => {
      const destination =
        event.detail?.page || event.detail?.label || event.detail;

      if (typeof destination === 'string') {
        setPage(destination);
        setError('');
      }
    };

    const handleSearch = (event) => {
      setSearch(event.detail?.value ?? event.detail ?? '');
    };

    window.addEventListener('quizmaster:navigate', handleNavigation);
    window.addEventListener('quizmaster:search', handleSearch);

    return () => {
      window.removeEventListener('quizmaster:navigate', handleNavigation);
      window.removeEventListener('quizmaster:search', handleSearch);
    };
  }, []);

  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
    localStorage.setItem('quizmaster_user', JSON.stringify(loggedInUser));
    setPage('Dashboard');
    loadAssessments();
  }

  function logout() {
    localStorage.removeItem('quizmaster_user');
    setUser(null);
    setPage('Dashboard');
    setSelected(null);
    setQuestions([]);
    setAnswers({});
    setResult(null);
  }

  async function startAssessment(assessment) {
    submissionLock.current = false;
    setTimeLeft(0);
    setLoading(true);
    setError('');
    setSelected(assessment);
    setAnswers({});
    setResult(null);

    try {
      const response = await fetch(
        `${API_URL}/api/assessments/${assessment.id}/questions`
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      const loadedQuestions = Array.isArray(data) ? data : [];
      setQuestions(loadedQuestions);
      setTimeLeft(Math.max(1, Number(assessment.duration_minutes) || 15) * 60);
      setPage('Take Assessment');
    } catch (err) {
      setError(err.message || 'Could not load questions.');
    } finally {
      setLoading(false);
    }
  }

  async function submitAssessment(automatic = false) {
    if (!selected || submissionLock.current) return;

    submissionLock.current = true;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/api/assessments/${selected.id}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user?.id ?? null,
            student_name: user?.name || user?.email || 'Guest',
            answers: Object.entries(answers).map(([question_id, answer]) => ({
              question_id,
              answer,
            })),
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setResult(data);
      setPage('Results');
      if (automatic) setTimeLeft(0);
      loadHistory();
      loadLeaderboard();
    } catch (err) {
      submissionLock.current = false;
      setError(err.message || 'Could not submit assessment.');
    } finally {
      setLoading(false);
    }
  }

  submitAssessmentRef.current = submitAssessment;

  useEffect(() => {
    if (page !== 'Take Assessment' || !selected || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [page, selected, questions.length]);

  useEffect(() => {
    if (
      page === 'Take Assessment' &&
      timeLeft === 0 &&
      selected &&
      questions.length > 0 &&
      !submissionLock.current
    ) {
      submitAssessmentRef.current?.(true);
    }
  }, [page, timeLeft, selected, questions.length]);

  function updateQuestion(index, field, value) {
    setNewQuestions((current) =>
      current.map((question, i) =>
        i === index ? { ...question, [field]: value } : question
      )
    );
  }

  function updateOption(questionIndex, optionIndex, value) {
    setNewQuestions((current) =>
      current.map((question, i) =>
        i === questionIndex
          ? {
              ...question,
              options: question.options.map((option, j) =>
                j === optionIndex ? value : option
              ),
            }
          : question
      )
    );
  }

  function addQuestion() {
    setNewQuestions((current) => [
      ...current,
      {
        question_text: '',
        question_type: 'MCQ',
        marks: 2,
        options: ['', '', '', ''],
        correct_answer: '',
      },
    ]);
  }

  function removeQuestion(index) {
    setNewQuestions((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  async function createAssessment(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          duration_minutes: Number(duration),
          total_marks: Number(totalMarks),
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      const assessment = data.assessment;
      const questionsToCreate = newQuestions.filter(
        (question) => question.question_text.trim()
      );

      for (const question of questionsToCreate) {
        const options =
          question.question_type === 'TRUE_FALSE'
            ? ['True', 'False']
            : question.options.filter((option) => option.trim());

        const correctAnswer = question.correct_answer;

        if (options.length < 2) {
          throw new Error('Each multiple-choice question needs at least two options.');
        }

        if (!correctAnswer || !options.includes(correctAnswer)) {
          throw new Error(
            `Select the correct answer for: ${question.question_text}`
          );
        }

        const questionResponse = await fetch(
          `${API_URL}/api/assessments/${assessment.id}/questions`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question_text: question.question_text,
              question_type: question.question_type,
              marks: Number(question.marks),
              options: options.map((option) => ({
                option_text: option,
                is_correct: option === correctAnswer,
              })),
              correct_answer: correctAnswer,
            }),
          }
        );

        const questionData = await questionResponse.json();

        if (!questionResponse.ok) {
          throw new Error(questionData.message || 'Could not add question.');
        }
      }

      await loadAssessments();
      setTitle('');
      setDescription('');
      setDuration(15);
      setTotalMarks(10);
      setNewQuestions([
        {
          question_text: '',
          question_type: 'MCQ',
          marks: 2,
          options: ['', '', '', ''],
          correct_answer: '',
        },
      ]);
      setPage('Assessments');
      setError('');
    } catch (err) {
      setError(err.message || 'Could not create assessment.');
    } finally {
      setLoading(false);
    }
  }

  const filteredAssessments = assessments.filter((assessment) =>
    `${assessment.title} ${assessment.description || ''}`
      .toLowerCase()
      .includes(String(search).toLowerCase())
  );

  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F8F2] font-sans text-[#718071]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-[#E1E9DD] bg-white md:block">
          <Sidebar />
        </aside>

        <div className="min-w-0 flex-1">
          <Topbar />

          <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-[#718F6D]">{page}</h1>
                <p className="mt-2 text-sm text-[#718071]">
                  Welcome, {user.name || 'User'}
                </p>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-lg border border-[#E1E9DD] bg-white px-4 py-2.5 text-sm text-[#718071] transition hover:bg-[#F5F8F2]"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>

            {error && (
              <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {page === 'Dashboard' && (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  <div className={cardClass}>
                    <ClipboardList className="mb-4 text-[#718071]" size={25} />
                    <p className="text-sm text-[#718071]">Total Assessments</p>
                    <p className="mt-2 text-3xl font-bold text-[#718F6D]">
                      {assessments.length}
                    </p>
                  </div>

                  <div className={cardClass}>
                    <BookOpen className="mb-4 text-[#718071]" size={25} />
                    <p className="text-sm text-[#718071]">Available Quizzes</p>
                    <p className="mt-2 text-3xl font-bold text-[#718F6D]">
                      {assessments.length}
                    </p>
                  </div>

                  <div className={cardClass}>
                    <FileCheck className="mb-4 text-[#718071]" size={25} />
                    <p className="text-sm text-[#718071]">Questions Answered</p>
                    <p className="mt-2 text-3xl font-bold text-[#718F6D]">
                      {result?.total_questions || 0}
                    </p>
                  </div>

                  <div className={cardClass}>
                    <TrendingUp className="mb-4 text-[#718071]" size={25} />
                    <p className="text-sm text-[#718071]">Your Score</p>
                    <p className="mt-2 text-3xl font-bold text-[#718F6D]">
                      {result ? `${result.percentage}%` : '—'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    className={buttonClass}
                    onClick={() => setPage('Attempt History')}
                  >
                    <Clock className="mr-2 inline" size={16} />
                    Attempt History
                  </button>
                  <button
                    className={buttonClass}
                    onClick={() => setPage('Leaderboard')}
                  >
                    <TrendingUp className="mr-2 inline" size={16} />
                    Leaderboard
                  </button>
                </div>

                <section className={`${cardClass} mt-6`}>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-[#718F6D]">
                      Recent Assessments
                    </h2>
                    <button
                      onClick={() => setPage('Assessments')}
                      className="text-sm font-medium text-[#718F6D] underline hover:text-[#718F6D]"
                    >
                      View all
                    </button>
                  </div>

                  {assessments.slice(0, 4).map((assessment) => (
                    <div
                      key={assessment.id}
                      className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E1E9DD] py-4"
                    >
                      <div>
                        <p className="font-semibold text-[#718F6D]">
                          {assessment.title}
                        </p>
                        <p className="mt-1 text-sm text-[#718071]">
                          {assessment.duration_minutes} minutes ·{' '}
                          {assessment.total_marks} marks
                        </p>
                      </div>
                      <button
                        className={buttonClass}
                        onClick={() => startAssessment(assessment)}
                      >
                        Start
                      </button>
                    </div>
                  ))}
                </section>
              </>
            )}

            {page === 'Assessments' && (
              <section className={cardClass}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-[#718F6D]">
                    All Assessments
                  </h2>
                  {isAdmin && (
                    <button
                      className={buttonClass}
                      onClick={() => setPage('Create Assessment')}
                    >
                      <Plus className="mr-2 inline" size={16} />
                      Create Assessment
                    </button>
                  )}
                </div>

                <input
                  className={`${inputClass} mb-5`}
                  placeholder="Search assessments..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredAssessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="rounded-xl border border-[#E1E9DD] bg-white p-5 transition hover:shadow-md"
                    >
                      <h3 className="font-bold text-[#718F6D]">
                        {assessment.title}
                      </h3>
                      <p className="mt-2 min-h-10 text-sm text-[#718071]">
                        {assessment.description || 'No description provided.'}
                      </p>
                      <div className="my-4 flex gap-4 text-sm text-[#718071]">
                        <span>
                          <Clock className="mr-1 inline" size={15} />
                          {assessment.duration_minutes} min
                        </span>
                        <span>{assessment.total_marks} marks</span>
                      </div>
                      <button
                        className={buttonClass}
                        onClick={() => startAssessment(assessment)}
                      >
                        <Play className="mr-2 inline" size={15} />
                        Start Assessment
                      </button>
                    </div>
                  ))}

                  {filteredAssessments.length === 0 && (
                    <p className="text-sm text-[#718071]">
                      No assessments found.
                    </p>
                  )}
                </div>
              </section>
            )}

            {(page === 'Attempt History' || page === 'History') && (
              <section className={cardClass}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-[#718F6D]">Attempt History</h2>
                  <button className={buttonClass} onClick={loadHistory}>Refresh</button>
                </div>
                {history.length === 0 ? (
                  <p className="text-sm text-[#718071]">No completed assessments found yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#E1E9DD] text-[#718F6D]">
                          <th className="px-3 py-3">Assessment</th>
                          <th className="px-3 py-3">Score</th>
                          <th className="px-3 py-3">Percentage</th>
                          <th className="px-3 py-3">Correct</th>
                          <th className="px-3 py-3">Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((attempt) => (
                          <tr key={attempt.id} className="border-b border-[#E1E9DD] last:border-0">
                            <td className="px-3 py-3 font-medium text-[#718F6D]">{attempt.assessment_title}</td>
                            <td className="px-3 py-3">{attempt.score}/{attempt.total_marks}</td>
                            <td className="px-3 py-3">{attempt.percentage}%</td>
                            <td className="px-3 py-3">{attempt.correct_answers}/{attempt.total_questions}</td>
                            <td className="px-3 py-3">{attempt.completed_at ? new Date(attempt.completed_at).toLocaleString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {page === 'Leaderboard' && (
              <section className={cardClass}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-[#718F6D]">Leaderboard</h2>
                  <button className={buttonClass} onClick={loadLeaderboard}>Refresh</button>
                </div>
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-[#718071]">No completed attempts are available yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#E1E9DD] text-[#718F6D]">
                          <th className="px-3 py-3">Rank</th>
                          <th className="px-3 py-3">Student</th>
                          <th className="px-3 py-3">Completed</th>
                          <th className="px-3 py-3">Average Score</th>
                          <th className="px-3 py-3">Best Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((student, index) => (
                          <tr key={`${student.student_name}-${index}`} className="border-b border-[#E1E9DD] last:border-0">
                            <td className="px-3 py-3 font-semibold text-[#718F6D]">{index + 1}</td>
                            <td className="px-3 py-3">{student.student_name}</td>
                            <td className="px-3 py-3">{student.assessments_completed}</td>
                            <td className="px-3 py-3">{student.average_percentage}%</td>
                            <td className="px-3 py-3">{student.best_percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {page === 'Create Assessment' && (
              <form onSubmit={createAssessment} className={cardClass}>
                <h2 className="mb-5 text-lg font-bold text-[#718F6D]">
                  Create New Assessment
                </h2>

                {!isAdmin && (
                  <p className="mb-4 rounded-lg bg-[#F5F8F2] p-3 text-sm text-[#718071]">
                    
                  </p>
                )}

                <fieldset disabled={!isAdmin || loading} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#718071]">
                      Assessment Title
                    </label>
                    <input
                      className={inputClass}
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Enter assessment title"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#718071]">
                      Description
                    </label>
                    <textarea
                      className={inputClass}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Enter assessment description"
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#718071]">
                        Duration (minutes)
                      </label>
                      <input
                        className={inputClass}
                        type="number"
                        min="1"
                        value={duration}
                        onChange={(event) => setDuration(event.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#718071]">
                        Total Marks
                      </label>
                      <input
                        className={inputClass}
                        type="number"
                        min="1"
                        value={totalMarks}
                        onChange={(event) => setTotalMarks(event.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-[#718F6D]">Questions</h3>
                    <button
                      type="button"
                      className="rounded-lg border border-[#E1E9DD] bg-white px-3 py-2 text-sm text-[#718071] hover:bg-[#F5F8F2]"
                      onClick={addQuestion}
                    >
                      <Plus className="mr-1 inline" size={15} />
                      Add Question
                    </button>
                  </div>

                  {newQuestions.map((question, index) => (
                    <div
                      key={index}
                      className="space-y-4 rounded-xl border border-[#E1E9DD] bg-white p-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-[#718F6D]">
                          Question {index + 1}
                        </h4>
                        {newQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(index)}
                            className="text-[#718071] hover:text-red-600"
                            aria-label="Remove question"
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
                      </div>

                      <input
                        className={inputClass}
                        value={question.question_text}
                        onChange={(event) =>
                          updateQuestion(
                            index,
                            'question_text',
                            event.target.value
                          )
                        }
                        placeholder="Enter question"
                        required={index === 0}
                      />

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-[#718071]">
                            Question Type
                          </label>
                          <select
                            className={inputClass}
                            value={question.question_type}
                            onChange={(event) => {
                              const type = event.target.value;
                              setNewQuestions((current) =>
                                current.map((item, i) =>
                                  i === index
                                    ? {
                                        ...item,
                                        question_type: type,
                                        options:
                                          type === 'TRUE_FALSE'
                                            ? ['True', 'False']
                                            : ['', '', '', ''],
                                        correct_answer: '',
                                      }
                                    : item
                                )
                              );
                            }}
                          >
                            <option value="MCQ">Multiple Choice</option>
                            <option value="TRUE_FALSE">True / False</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-[#718071]">
                            Marks
                          </label>
                          <input
                            className={inputClass}
                            type="number"
                            min="1"
                            value={question.marks}
                            onChange={(event) =>
                              updateQuestion(index, 'marks', event.target.value)
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className="flex items-center gap-3"
                          >
                            <input
                              type="radio"
                              name={`correct-${index}`}
                              checked={
                                Boolean(option) &&
                                question.correct_answer === option
                              }
                              onChange={() =>
                                updateQuestion(index, 'correct_answer', option)
                              }
                              disabled={!option.trim()}
                            />
                            <input
                              className={inputClass}
                              value={option}
                              readOnly={question.question_type === 'TRUE_FALSE'}
                              onChange={(event) =>
                                updateOption(
                                  index,
                                  optionIndex,
                                  event.target.value
                                )
                              }
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                          </div>
                        ))}
                        <p className="text-xs text-[#718071]">
                          Select the radio button beside the correct answer.
                        </p>
                      </div>
                    </div>
                  ))}

                  <button type="submit" className={buttonClass}>
                    {loading ? 'Creating...' : 'Create Assessment'}
                  </button>
                </fieldset>
              </form>
            )}

            {page === 'Take Assessment' && (
              <section className={cardClass}>
                <button
                  onClick={() => setPage('Assessments')}
                  className="mb-5 text-sm text-[#718071] hover:text-[#718F6D]"
                >
                  <ArrowLeft className="mr-1 inline" size={16} />
                  Back to assessments
                </button>

                <h2 className="mb-2 text-xl font-bold text-[#718F6D]">
                  {selected?.title}
                </h2>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[#718071]">
                    Time remaining: {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                  </p>
                </div>

                {questions.length === 0 && (
                  <p className="text-sm text-[#718071]">
                   
                  </p>
                )}

                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="mb-5 rounded-xl border border-[#E1E9DD] p-4"
                  >
                    <p className="mb-4 font-semibold text-[#718F6D]">
                      {index + 1}. {question.question_text}
                      <span className="ml-2 text-sm font-normal text-[#718071]">
                        ({question.marks} marks)
                      </span>
                    </p>

                    {question.options.map((option) => (
                      <label
                        key={option.id}
                        className="mb-2 flex cursor-pointer items-center gap-3 rounded-lg border border-[#E1E9DD] p-3 hover:bg-[#F5F8F2]"
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={
                            String(answers[question.id] ?? '') ===
                            String(option.id)
                          }
                          onChange={() =>
                            setAnswers((current) => ({
                              ...current,
                              [question.id]: option.id,
                            }))
                          }
                        />
                        <span className="text-[#718071]">
                          {option.option_text}
                        </span>
                      </label>
                    ))}
                  </div>
                ))}

                {questions.length > 0 && (
                  <button
                    className={buttonClass}
                    onClick={submitAssessment}
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit Assessment'}
                  </button>
                )}
              </section>
            )}

            {page === 'Results' && (
              <section className={cardClass}>
                <div className="mb-5 flex items-center gap-3">
                  <CheckCircle className="text-[#718071]" size={28} />
                  <h2 className="text-xl font-bold text-[#718F6D]">
                    {result ? 'Assessment Results' : 'Results'}
                  </h2>
                </div>

                {result ? (
                  <>
                    <p className="text-[#718071]">{result.assessment}</p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-lg bg-[#F5F8F2] p-4">
                        <p className="text-sm text-[#718071]">Score</p>
                        <p className="mt-1 text-2xl font-bold text-[#718F6D]">
                          {result.score}/{result.total_marks}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#F5F8F2] p-4">
                        <p className="text-sm text-[#718071]">Percentage</p>
                        <p className="mt-1 text-2xl font-bold text-[#718F6D]">
                          {result.percentage}%
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#F5F8F2] p-4">
                        <p className="text-sm text-[#718071]">Correct Answers</p>
                        <p className="mt-1 text-2xl font-bold text-[#718F6D]">
                          {result.correct_answers}/{result.total_questions}
                        </p>
                      </div>
                    </div>

                    <h3 className="mt-8 font-bold text-[#718F6D]">
                      Answer Review
                    </h3>

                    {result.results?.map((item, index) => (
                      <div
                        key={item.question_id}
                        className="mt-3 rounded-lg border border-[#E1E9DD] p-4"
                      >
                        <p className="font-semibold text-[#718F6D]">
                          {index + 1}. {item.question_text}
                        </p>
                        <p className="mt-2 text-sm text-[#718071]">
                          Your answer: {item.selected_answer ?? 'Not answered'}
                        </p>
                        <p className="mt-1 text-sm text-[#718071]">
                          Correct answer: {item.correct_answer}
                        </p>
                        <p className="mt-2 text-sm font-medium text-[#718F6D]">
                          {item.is_correct ? 'Correct' : 'Incorrect'} ·{' '}
                          {item.marks_awarded}/{item.total_question_marks} marks
                        </p>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-sm text-[#718071]">
                    
                  </p>
                )}

                <button
                  className={`${buttonClass} mt-6`}
                  onClick={() => setPage('Assessments')}
                >
                  View Assessments
                </button>
              </section>
            )}

            {[
              
            ].includes(page) && (
              <section className={cardClass}>
                <h2 className="text-lg font-bold text-[#718F6D]">{page}</h2>
                <p className="mt-2 text-sm text-[#718071]">
                 
                </p>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}