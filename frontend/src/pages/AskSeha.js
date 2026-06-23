import { useState } from 'react';
import { askSeha } from '../api';

function AskSeha() {
  const [question, setQuestion] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [result, setResult]     = useState(null);
  const [history, setHistory]   = useState([]);

  const handleAsk = async () => {
    if (!question.trim() || question.trim().length < 3) {
      setError('Please enter a question (at least 3 characters).');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await askSeha(question, language);
      setResult(res.data);
      setHistory(prev => [{ question, language, ...res.data }, ...prev].slice(0, 5));
      setQuestion('');
    } catch {
      setError('Could not reach the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const SUGGESTIONS = [
    "What are the symptoms of malaria?",
    "How is tuberculosis treated in Ethiopia?",
    "What vaccines does a newborn need?",
    "How do I manage high blood pressure?",
    "የወባ በሽታ ምልክቶች ምንድን ናቸው?",
  ];

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px' }}>

      {/* Header */}
      <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#15803d', marginBottom: '4px' }}>
        🤖 Ask SEHA
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '0.95rem' }}>
        Ask any health question in English or Amharic — grounded in MoH guidelines.
      </p>

      {/* Language toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setLanguage('en')}
          style={{
            padding: '8px 20px', borderRadius: '20px', border: '2px solid',
            borderColor: language === 'en' ? '#15803d' : '#d1d5db',
            background: language === 'en' ? '#15803d' : 'white',
            color: language === 'en' ? 'white' : '#6b7280',
            fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem'
          }}
        >
          English
        </button>
        <button
          onClick={() => setLanguage('am')}
          style={{
            padding: '8px 20px', borderRadius: '20px', border: '2px solid',
            borderColor: language === 'am' ? '#15803d' : '#d1d5db',
            background: language === 'am' ? '#15803d' : 'white',
            color: language === 'am' ? 'white' : '#6b7280',
            fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem'
          }}
        >
          አማርኛ
        </button>
      </div>

      {/* Suggestion chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => setQuestion(s)}
            style={{
              padding: '6px 14px', borderRadius: '20px',
              border: '1px solid #d1d5db', background: '#f9fafb',
              color: '#374151', fontSize: '0.8rem', cursor: 'pointer'
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <textarea
          rows={3}
          placeholder={language === 'am' ? 'ጥያቄዎን እዚህ ይጻፉ...' : 'Type your health question here...'}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: '8px',
            border: '1px solid #d1d5db', fontSize: '0.95rem',
            resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c',
          borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '0.9rem'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Ask button */}
      <button
        onClick={handleAsk}
        disabled={loading}
        style={{
          width: '100%', background: loading ? '#86efac' : '#15803d',
          color: 'white', border: 'none', borderRadius: '8px',
          padding: '14px', fontSize: '1rem', fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '24px'
        }}
      >
        {loading ? 'SEHA is thinking...' : 'Ask SEHA'}
      </button>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '16px', color: '#6b7280' }}>
          <div style={{
            width: '36px', height: '36px', border: '4px solid #dcfce7',
            borderTop: '4px solid #15803d', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 10px'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Searching MoH guidelines...
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{
          border: '1px solid #d1fae5', borderRadius: '12px',
          background: '#f0fdf4', padding: '20px', marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>🤖</span>
            <span style={{ fontWeight: '700', color: '#15803d', fontSize: '1rem' }}>SEHA</span>
            {result.context_used && (
              <span style={{
                fontSize: '0.7rem', background: '#dcfce7', color: '#166534',
                padding: '2px 8px', borderRadius: '10px', fontWeight: '600'
              }}>
                📚 Based on MoH Guidelines
              </span>
            )}
          </div>

          <p style={{ color: '#1f2937', lineHeight: '1.7', whiteSpace: 'pre-wrap', marginBottom: '12px' }}>
            {result.answer}
          </p>

          {result.sources && result.sources.length > 0 && (
            <div style={{ borderTop: '1px solid #bbf7d0', paddingTop: '10px', marginTop: '10px' }}>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                📄 Sources: {result.sources.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div>
          <h3 style={{ fontWeight: '600', color: '#374151', marginBottom: '12px', fontSize: '0.95rem' }}>
            Previous Questions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.slice(1).map((h, i) => (
              <div
                key={i}
                onClick={() => setResult(h)}
                style={{
                  border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px',
                  background: 'white', cursor: 'pointer'
                }}
              >
                <p style={{ fontWeight: '600', fontSize: '0.85rem', color: '#374151', margin: '0 0 4px' }}>
                  {h.question}
                </p>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0 }}>
                  {h.answer?.slice(0, 80)}...
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AskSeha;