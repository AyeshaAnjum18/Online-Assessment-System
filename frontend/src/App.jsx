
import { useState } from 'react'

function App() {
  const [role, setRole] = useState('Student')

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <nav className="bg-indigo-700 px-8 py-5 text-white shadow-lg">
        <h1 className="text-2xl font-bold">
          QuizMaster
        </h1>
        <p className="text-sm text-indigo-200">
          Online Assessment and Quiz Management System
        </p>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-3xl font-bold">
          Welcome to QuizMaster
        </h2>
        <p className="mt-3 text-slate-600">
          Learn, attempt assessments, and track your performance.
        </p>

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => setRole('Student')}
            className={`rounded-lg px-6 py-3 font-semibold ${
              role === 'Student'
                ? 'bg-indigo-700 text-white'
                : 'bg-white text-indigo-700'
            }`}
          >
            Student
          </button>

          <button
            onClick={() => setRole('Admin')}
            className={`rounded-lg px-6 py-3 font-semibold ${
              role === 'Admin'
                ? 'bg-indigo-700 text-white'
                : 'bg-white text-indigo-700'
            }`}
          >
            Admin
          </button>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-md">
          <h3 className="text-2xl font-bold">
            {role} Dashboard
          </h3>

          {role === 'Student' ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl bg-indigo-50 p-6">
                <h4 className="text-lg font-semibold">
                  Available Assessments
                </h4>
                <p className="mt-2 text-slate-600">
                  View and attempt your quizzes.
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-6">
                <h4 className="text-lg font-semibold">
                  My Results
                </h4>
                <p className="mt-2 text-slate-600">
                  Track your scores and progress.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-indigo-50 p-6">
              <h4 className="text-lg font-semibold">
                Assessment Management
              </h4>
              <p className="mt-2 text-slate-600">
                Create quizzes, add questions, and manage assessments.
              </p>
              <button className="mt-5 rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800">
                Create Assessment
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
