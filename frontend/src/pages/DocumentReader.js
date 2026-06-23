import { useState } from 'react';
import { uploadDocument } from '../api';

function DocumentReader() {
  const [fileUrl, setFileUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [result, setResult]   = useState(null);

  const handleAnalyze = async () => {
    if (!fileUrl.trim()) {
      setError('Please enter a document URL.');
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await uploadDocument(fileUrl);
      setResult(res.data);
    } catch {
      setError('Could not analyze the document. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px' }}>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#15803d', marginBottom: '4px' }}>
        📄 Document Reader
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '0.95rem' }}>
        Paste the URL of a medical document (lab result, discharge summary, etc.) to get an AI summary.
      </p>

      <input
        type="text"
        placeholder="https://your-blob-url.com/document.pdf"
        value={fileUrl}
        onChange={e => setFileUrl(e.target.value)}
        style={{
          width: '100%', padding: '12px 14px', borderRadius: '8px',
          border: '1px solid #d1d5db', fontSize: '0.95rem',
          boxSizing: 'border-box', marginBottom: '12px'
        }}
      />

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c',
          borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '0.9rem'
        }}>
          ⚠️ {error}
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={loading}
        style={{
          width: '100%', background: loading ? '#86efac' : '#15803d',
          color: 'white', border: 'none', borderRadius: '8px',
          padding: '14px', fontSize: '1rem', fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '24px'
        }}
      >
        {loading ? 'Analyzing...' : 'Analyze Document'}
      </button>

      {loading && (
        <div style={{ textAlign: 'center', padding: '16px', color: '#6b7280' }}>
          <div style={{
            width: '36px', height: '36px', border: '4px solid #dcfce7',
            borderTop: '4px solid #15803d', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 10px'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Reading document with AI...
        </div>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Summary */}
          <div style={{ border: '1px solid #d1fae5', borderRadius: '12px', background: '#f0fdf4', padding: '20px' }}>
            <h2 style={{ fontWeight: '700', color: '#15803d', marginBottom: '8px', fontSize: '1rem' }}>📋 Summary</h2>
            <p style={{ color: '#1f2937', lineHeight: '1.7', margin: 0 }}>{result.summary}</p>
          </div>

          {/* Patient info */}
          {result.patient_info && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', background: 'white', padding: '20px' }}>
              <h2 style={{ fontWeight: '700', color: '#374151', marginBottom: '10px', fontSize: '1rem' }}>👤 Patient Info</h2>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {Object.entries(result.patient_info).map(([k, v]) => v && (
                  <div key={k}>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 2px', textTransform: 'capitalize' }}>{k}</p>
                    <p style={{ fontWeight: '600', color: '#111827', margin: 0 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key findings */}
          {result.key_findings?.length > 0 && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', background: 'white', padding: '20px' }}>
              <h2 style={{ fontWeight: '700', color: '#374151', marginBottom: '10px', fontSize: '1rem' }}>🔍 Key Findings</h2>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {result.key_findings.map((f, i) => (
                  <li key={i} style={{ color: '#374151', marginBottom: '6px', lineHeight: '1.5' }}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Abnormal values */}
          {result.abnormal_values?.length > 0 && (
            <div style={{ border: '1px solid #fca5a5', borderRadius: '12px', background: '#fef2f2', padding: '20px' }}>
              <h2 style={{ fontWeight: '700', color: '#b91c1c', marginBottom: '10px', fontSize: '1rem' }}>⚠️ Abnormal Values</h2>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {result.abnormal_values.map((v, i) => (
                  <li key={i} style={{ color: '#7f1d1d', marginBottom: '6px' }}>{v}</li>
                ))}
              </ul>
            </div>
          )}

          <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
            ⚠️ For informational use only. Always consult a licensed healthcare provider.
          </p>
        </div>
      )}
    </div>
  );
}

export default DocumentReader;