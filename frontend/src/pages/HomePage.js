import { Link } from 'react-router-dom';

const FEATURES = [
  { to: '/symptoms', icon: '🩺', title: 'Symptom Checker', desc: 'Select your symptoms and get an AI-powered health assessment with triage level.', color: 'border-green-200 hover:border-green-400' },
  { to: '/documents', icon: '📄', title: 'Document Reader', desc: 'Upload medical documents and get an instant AI summary of key findings.', color: 'border-blue-200 hover:border-blue-400' },
  { to: '/prescription', icon: '💊', title: 'Prescription Scanner', desc: 'Photograph a handwritten prescription and get a digital card with safety check.', color: 'border-purple-200 hover:border-purple-400' },
  { to: '/ask', icon: '🤖', title: 'Ask SEHA', desc: 'Ask health questions in Amharic or English — grounded in MoH guidelines.', color: 'border-orange-200 hover:border-orange-400' },
];

function HomePage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-green-700 mb-3">
          Welcome to SEHA 🏥
        </h1>
        <p className="text-gray-500 text-base sm:text-lg mb-10">
          AI Healthcare Assistant for Ethiopia — ሰሃ
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {FEATURES.map(f => (
            <Link
              key={f.to}
              to={f.to}
              className={`border-2 ${f.color} rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all`}
            >
              <div className="text-3xl mb-2">{f.icon}</div>
              <h2 className="font-bold text-gray-800 mb-1">{f.title}</h2>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </Link>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-10">
          ⚠️ For informational use only. Always consult a licensed healthcare provider.
        </p>
      </div>
    </div>
  );
}

export default HomePage;