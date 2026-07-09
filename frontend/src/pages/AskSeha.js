import { useState, useRef, useEffect } from 'react';
import { askSehaStream } from '../api';

const DISCLAIMER =
  'This is for information only. Always consult a licensed healthcare provider.';

const SUGGESTIONS = [
  'What are the symptoms of malaria?',
  'How is tuberculosis treated in Ethiopia?',
  'What vaccines does a newborn need?',
  'How do I manage high blood pressure?',
  'የወባ በሽታ ምልክቶች ምንድን ናቸው?',
];

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#9ca3af',
            display: 'inline-block',
            animation: `bounce 1.2s ${i * 0.2}s infinite ease-in-out`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function SourceCitations({ sources }) {
  if (!sources?.length) return null;

  return (
    <details style={{ marginTop: '10px' }}>
      <summary style={{
        cursor: 'pointer', fontSize: '0.75rem', color: '#6b7280',
        fontWeight: '600', userSelect: 'none',
      }}>
        📄 {sources.length} source{sources.length > 1 ? 's' : ''} — click to expand
      </summary>
      <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '0.75rem', color: '#6b7280' }}>
        {sources.map((src, i) => (
          <li key={i} style={{ marginBottom: '4px', lineHeight: '1.4' }}>
            {src.replace(/\.pdf$/i, '').replace(/_/g, ' ')}
          </li>
        ))}
      </ul>
    </details>
  );
}

function AskSeha() {
  const [question, setQuestion] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);
  const abortRef = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleClear = () => {
    abortRef.current = true;
    setMessages([]);
    setQuestion('');
    setError(null);
    setLoading(false);
  };

  const handleAsk = async (text) => {
    const q = (text ?? question).trim();
    if (q.length < 3) {
      setError('Please enter a question (at least 3 characters).');
      return;
    }

    setError(null);
    setQuestion('');
    setLoading(true);
    abortRef.current = false;

    const userMsg = { id: Date.now(), role: 'user', content: q };
    const assistantId = Date.now() + 1;
    const assistantMsg = {
      id: assistantId,
      role: 'assistant',
      content: '',
      sources: [],
      context_used: false,
      streaming: true,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);

    await askSehaStream(q, language, {
      onMeta: ({ sources, context_used }) => {
        if (abortRef.current) return;
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, sources, context_used } : m
          )
        );
      },
      onToken: (token) => {
        if (abortRef.current) return;
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, content: m.content + token } : m
          )
        );
      },
      onDone: () => {
        if (abortRef.current) return;
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, streaming: false } : m
          )
        );
        setLoading(false);
      },
      onError: (msg) => {
        setError(msg);
        setMessages(prev => prev.filter(m => m.id !== assistantId));
        setLoading(false);
      },
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleAsk();
    }
  };

  return (
    <div style={{
      maxWidth: '720px', margin: '0 auto', height: 'calc(100vh - 56px)',
      display: 'flex', flexDirection: 'column', padding: '0 16px',
    }}>

      {/* Header */}
      <div style={{ padding: '20px 0 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#15803d', margin: '0 0 4px' }}>
              🤖 Ask SEHA
            </h1>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
              Health Q&A grounded in MoH guidelines
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: '1px solid #d1d5db',
                background: 'white', color: '#6b7280', fontSize: '0.8rem',
                cursor: 'pointer', fontWeight: '500', flexShrink: 0,
              }}
            >
              Clear chat
            </button>
          )}
        </div>

        {/* Disclaimer banner */}
        <div style={{
          marginTop: '12px', background: '#fffbeb', border: '1px solid #fcd34d',
          borderRadius: '8px', padding: '8px 12px', fontSize: '0.78rem', color: '#92400e',
        }}>
          ⚠️ {DISCLAIMER}
        </div>

        {/* Language toggle */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          {[
            { code: 'en', label: 'English' },
            { code: 'am', label: 'አማርኛ' },
          ].map(({ code, label }) => (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              style={{
                padding: '6px 16px', borderRadius: '20px', border: '2px solid',
                borderColor: language === code ? '#15803d' : '#d1d5db',
                background: language === code ? '#15803d' : 'white',
                color: language === code ? 'white' : '#6b7280',
                fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat messages */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
        gap: '12px', paddingBottom: '12px',
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏥</div>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '20px' }}>
              {language === 'am'
                ? 'የጤና ጥያቄዎን በአማርኛ ወይም በእንግሊዝኛ ይጠይቁ'
                : 'Ask any health question — try a suggestion below'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleAsk(s)}
                  disabled={loading}
                  style={{
                    padding: '6px 14px', borderRadius: '20px',
                    border: '1px solid #d1fae5', background: '#f0fdf4',
                    color: '#15803d', fontSize: '0.78rem', cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              maxWidth: '85%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? '#2563eb' : 'white',
              color: msg.role === 'user' ? 'white' : '#1f2937',
              border: msg.role === 'user' ? 'none' : '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              lineHeight: '1.6',
              fontSize: '0.9rem',
            }}>
              {msg.role === 'assistant' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '700', color: '#15803d', fontSize: '0.8rem' }}>SEHA</span>
                  {msg.context_used && (
                    <span style={{
                      fontSize: '0.65rem', background: '#dcfce7', color: '#166534',
                      padding: '2px 6px', borderRadius: '8px', fontWeight: '600',
                    }}>
                      MoH Guidelines
                    </span>
                  )}
                </div>
              )}

              {msg.content ? (
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              ) : msg.streaming ? (
                <TypingIndicator />
              ) : null}

              {msg.role === 'assistant' && !msg.streaming && (
                <>
                  <SourceCitations sources={msg.sources} />
                  <p style={{
                    fontSize: '0.68rem', color: '#9ca3af', margin: '8px 0 0',
                    borderTop: '1px solid #f3f4f6', paddingTop: '6px',
                  }}>
                    {DISCLAIMER}
                  </p>
                </>
              )}
            </div>
          </div>
        ))}

        <div ref={chatEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c',
          borderRadius: '8px', padding: '8px 12px', marginBottom: '8px', fontSize: '0.85rem',
          flexShrink: 0,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Input area */}
      <div style={{
        padding: '12px 0 16px', borderTop: '1px solid #e5e7eb',
        flexShrink: 0, background: 'white',
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            rows={2}
            placeholder={language === 'am' ? 'ጥያቄዎን እዚህ ይጻፉ...' : 'Type your health question...'}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '10px',
              border: '1px solid #d1d5db', fontSize: '0.9rem',
              resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
              opacity: loading ? 0.6 : 1,
            }}
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading || question.trim().length < 3}
            style={{
              padding: '10px 18px', borderRadius: '10px', border: 'none',
              background: loading || question.trim().length < 3 ? '#86efac' : '#15803d',
              color: 'white', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem', whiteSpace: 'nowrap', height: '44px',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default AskSeha;
