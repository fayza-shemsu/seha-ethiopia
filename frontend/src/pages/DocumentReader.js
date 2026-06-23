import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadDocument } from '../api';

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
};

function DocumentReader() {
  const [fileUrl, setFileUrl] = useState('');
  const [droppedFile, setDroppedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [result, setResult]   = useState(null);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null);
    setResult(null);
    if (rejectedFiles.length > 0) {
      setError('That file type is not supported. Please upload a PDF, JPG, or PNG.');
      return;
    }
    if (acceptedFiles.length > 0) {
      setDroppedFile(acceptedFiles[0]);
      setFileUrl('');
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
    setLoading(true);
    try {
      // NOTE: dropped files need to be uploaded to blob storage first to get a URL.
      // That wiring happens in Day 15 (Azure Blob integration).
      // For now, the URL field is fully functional end-to-end.
      const targetUrl = fileUrl.trim();
      if (!targetUrl) {
        setError('File upload to cloud storage is coming in Day 15. For now, please paste a document URL.');
        setLoading(false);
        return;
      }
      const res = await uploadDocument(targetUrl);
      setResult(res.data);
    } catch {
      setError('Could not analyze the document. Please check the URL and try again.');
    } finally {
      setLoading(false);
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

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
        <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>OR</span>
        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
      </div>

      {/* URL input */}
      <input
        type="text"
        placeholder="Enter document URL"
        value={fileUrl}
        onChange={e => { setFileUrl(e.target.value); setDroppedFile(null); }}
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

          <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
            ⚠️ For informational use only. Always consult a licensed healthcare provider.
          </p>
        </div>
      )}
    </div>
  );
}

export default DocumentReader;