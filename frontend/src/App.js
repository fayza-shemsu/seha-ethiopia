import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SymptomChecker from './pages/SymptomChecker';
import DocumentReader from './pages/DocumentReader';
import PrescriptionScanner from './pages/PrescriptionScanner';
import AskSeha from './pages/AskSeha';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/symptoms', label: 'Symptom Checker' },
    { to: '/documents', label: 'Document Reader' },
    { to: '/prescription', label: 'Prescription Scanner' },
    { to: '/ask', label: 'Ask SEHA' },
  ];

  return (
    <Router>
      <nav className="bg-green-700 text-white px-4 sm:px-6 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="font-bold text-lg" onClick={() => setMenuOpen(false)}>
            SEHA 🏥
          </Link>

          {/* Desktop links */}
          <div className="hidden sm:flex gap-6">
            {links.slice(1).map(link => (
              <Link key={link.to} to={link.to} className="hover:text-green-200 text-sm">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            className="sm:hidden text-2xl"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="sm:hidden flex flex-col gap-3 mt-3 pb-2">
            {links.slice(1).map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="hover:text-green-200 text-sm"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/symptoms" element={<SymptomChecker />} />
        <Route path="/documents" element={<DocumentReader />} />
        <Route path="/prescription" element={<PrescriptionScanner />} />
        <Route path="/ask" element={<AskSeha />} />
      </Routes>
    </Router>
  );
}

export default App;