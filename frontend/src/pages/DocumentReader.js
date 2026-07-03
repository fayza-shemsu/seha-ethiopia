import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadToBlob, uploadDocument, askSeha } from '../api';

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
};

function DocumentReader() {
  const [fileUrl, setFileUrl] = useState('');
  const [droppedFile, setDroppedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  // For asking questions about the document
  const [question, setQuestion] = useState('');
  const [askingDoc, setAskingDoc] = useState(false);
  const [docAnswer, setDocAnswer] = useState(null);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null);
    setResult(null);
    setDocAnswer(null);
    if (rejectedFiles.length > 0) {
      setError('That file type is not supported. Please upload a PDF, JPG, or PNG.');
      return;
    }
    if (acceptedFiles.length > 0) {
      setDroppedFile(acceptedFiles[0]);
      setFileUrl(''); // Clear URL when file is dropped
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
  });

  const handleAnalyze = async () => {
    if (!droppedFile && !fileUrl.trim()) {
      setError('Please drop a file or enter a document URL.');
      return;
    }

    setError(null);
    setResult(null);
    setDocAnswer(null);
    setLoading(true);

    try {
      let targetUrl = fileUrl.trim();

      // If user dropped a file → upload to Azure Blob first
      if (droppedFile) {
        const uploadRes = await uploadToBlob(droppedFile);
        targetUrl = uploadRes.data.url;
        console.log("✅ Uploaded to Blob:", targetUrl);
      }

      if (!targetUrl) {
        throw new Error("No valid document URL available");
      }

      const res = await uploadDocument(targetUrl);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Could not analyze the document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAskAboutDoc = async () => {
    if (!question.trim() || !result) return;

    setAskingDoc(true);
    setDocAnswer(null);

    try {
      const contextualQuestion = `Based on this document: "${result.summary || 'No summary available'}". Question: ${question}`;
      const res = await askSeha(contextualQuestion, 'en');
      setDocAnswer(res.data.answer || res.data);
    } catch (err) {
      console.error(err);
      setDocAnswer('Could not get an answer right now. Please try again.');
    } finally {
      setAskingDoc(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px' }}>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#15803d', marginBottom: '4px' }}>
        📄 Document Reader
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '0.95rem' }}>
        Upload a medical document (PDF, JPG, PNG) or paste its URL to get an AI summary.
      </p>

      {/* Drag and drop zone */}
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? '#15803d' : '#d1d5db'}`,
          borderRadius: '12px',
          background: isDragActive ? '#f0fdf4' : '#fafafa',
          padding: '32px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: '16px',
          transition: 'all 0.15s'
        }}
      >
        <input {...getInputProps()} />
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📁</div>
        {droppedFile ? (
          <p style={{ color: '#15803d', fontWeight: '600', margin: 0 }}>
            ✓ {droppedFile.name}
          </p>
        ) : isDragActive ? (
          <p style={{ color: '#15803d', margin: 0 }}>Drop the file here...</p>
        ) : (
          <>
            <p style={{ color: '#374151', fontWeight: '500', margin: '0 0 4px' }}>
              Drag & drop a document here, or click to browse
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: 0 }}>
              Supports PDF, JPG, PNG
            </p>
          </>
        )}
      </div>

      {/* OR Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
        <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>OR</span>
        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
      </div>

      {/* URL input */}
      <input
        type="text"
        placeholder="Enter document URL (optional if file is dropped)"
        value={fileUrl}
        onChange={e => { 
          setFileUrl(e.target.value); 
          setDroppedFile(null); 
        }}
        style={{
          width: '100%', padding: '12px 14px', borderRadius: '8px',
          border: '1px solid #d1d5db', fontSize: '0.95rem',
          boxSizing: 'border-box', marginBottom: '16px'
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
        {loading ? 'Analyzing Document...' : 'Analyze Document'}
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
          <div style={{ border: '1px solid #d1fae5', borderRadius: '12px', background: '#f0fdf4', padding: '20px' }}>
            <h2 style={{ fontWeight: '700', color: '#15803d', marginBottom: '8px', fontSize: '1rem' }}>📋 Summary</h2>
            <p style={{ color: '#1f2937', lineHeight: '1.7', margin: 0 }}>{result.summary}</p>
          </div>

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

          {result.tables?.length > 0 && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', background: 'white', padding: '20px' }}>
              <h2 style={{ fontWeight: '700', color: '#374151', marginBottom: '12px', fontSize: '1rem' }}>
                📊 Tables ({result.tables.length})
              </h2>
              {result.tables.map((table, ti) => (
                <div key={ti} style={{ overflowX: 'auto', marginBottom: ti < result.tables.length - 1 ? '16px' : 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <tbody>
                      {table.map((row, ri) => (
                        <tr key={ri} style={{ background: ri === 0 ? '#f0fdf4' : 'white' }}>
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              style={{
                                border: '1px solid #e5e7eb',
                                padding: '8px 10px',
                                color: '#374151',
                                fontWeight: ri === 0 ? '600' : 'normal',
                              }}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {result.pages_analyzed > 0 && (
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center', margin: 0 }}>
              Analyzed {result.pages_analyzed} page{result.pages_analyzed > 1 ? 's' : ''}
            </p>
          )}

          {/* Ask question about this document */}
          {result && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ marginBottom: '8px' }}>Ask a question about this document:</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. What is the main diagnosis?"
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
                <button
                  onClick={handleAskAboutDoc}
                  disabled={askingDoc || !question.trim()}
                  style={{
                    padding: '12px 20px',
                    background: '#15803d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: askingDoc ? 'not-allowed' : 'pointer'
                  }}
                >
                  {askingDoc ? 'Asking...' : 'Ask'}
                </button>
              </div>
              {docAnswer && (
                <div style={{ marginTop: '12px', padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #d1fae5' }}>
                  <strong>Answer:</strong> {docAnswer}
                </div>
              )}
            </div>
          )}

          <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', marginTop: '16px' }}>
            ⚠️ For informational use only. Always consult a licensed healthcare provider.
          </p>
        </div>
      )}
    </div>
  );
}

export default DocumentReader;