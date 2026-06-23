import { useState } from 'react';
import { scanPrescription } from '../api';

const SAFETY_STYLE = {
  SAFE:           { bg: '#f0fdf4', border: '#86efac', color: '#166534', icon: '✅' },
  'REVIEW NEEDED':{ bg: '#fffbeb', border: '#fcd34d', color: '#92400e', icon: '⚠️' },
  UNKNOWN:        { bg: '#f9fafb', border: '#d1d5db', color: '#6b7280', icon: '❓' },
};

function PrescriptionScanner() {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [result, setResult]     = useState(null);

  const handleScan = async () => {
    if (!imageUrl.trim()) {
      setError('Please enter an image URL.');
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await scanPrescription(imageUrl);
      setResult(res.data);
    } catch {
      setError('Could not scan the prescription. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const safety = result ? (SAFETY_STYLE[result.safety_status] || SAFETY_STYLE['UNKNOWN']) : null;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px' }}>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#15803d', marginBottom: '4px' }}>
        💊 Prescription Scanner
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '0.95rem' }}>
        Paste the URL of a prescription image to extract drug details and check safety.
      </p>

      <input
        type="text"
        placeholder="https://your-blob-url.com/prescription.jpg"
        value={imageUrl}
        onChange={e => setImageUrl(e.target.value)}
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
        onClick={handleScan}
        disabled={loading}
        style={{
          width: '100%', background: loading ? '#86efac' : '#15803d',
          color: 'white', border: 'none', borderRadius: '8px',
          padding: '14px', fontSize: '1rem', fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '24px'
        }}
      >
        {loading ? 'Scanning...' : 'Scan Prescription'}
      </button>

      {loading && (
        <div style={{ textAlign: 'center', padding: '16px', color: '#6b7280' }}>
          <div style={{
            width: '36px', height: '36px', border: '4px solid #dcfce7',
            borderTop: '4px solid #15803d', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 10px'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Reading prescription with AI...
        </div>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Drug card */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', background: 'white', padding: '24px' }}>
            <h2 style={{ fontWeight: '700', color: '#374151', marginBottom: '16px', fontSize: '1rem' }}>
              💊 Prescription Details
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Drug Name', value: result.drug_name },
                { label: 'Dosage', value: result.dose_mg ? `${result.dose_mg} mg` : null },
                { label: 'Frequency', value: result.frequency },
                { label: 'Duration', value: result.duration_days ? `${result.duration_days} days` : null },
                { label: 'Doctor', value: result.doctor_name },
                { label: 'Patient', value: result.patient_name },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 2px' }}>{label}</p>
                  <p style={{ fontWeight: '600', color: value ? '#111827' : '#d1d5db', margin: 0 }}>
                    {value || 'Not found'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Safety status */}
          <div style={{
            border: `1px solid ${safety.border}`, borderRadius: '12px',
            background: safety.bg, padding: '20px'
          }}>
            <h2 style={{ fontWeight: '700', color: safety.color, marginBottom: '8px', fontSize: '1rem' }}>
              {safety.icon} Safety Check — {result.safety_status}
            </h2>
            <p style={{ color: safety.color, margin: 0, fontSize: '0.9rem', lineHeight: '1.6' }}>
              {result.safety_note}
            </p>
          </div>

          {/* Raw OCR */}
          {result.raw_ocr_text && (
            <details style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', background: 'white' }}>
              <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#6b7280', fontSize: '0.85rem' }}>
                View Raw OCR Text
              </summary>
              <pre style={{
                marginTop: '12px', fontSize: '0.8rem', color: '#374151',
                whiteSpace: 'pre-wrap', background: '#f9fafb',
                padding: '12px', borderRadius: '6px', lineHeight: '1.5'
              }}>
                {result.raw_ocr_text}
              </pre>
            </details>
          )}

          <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
            ⚠️ Always verify prescriptions with a licensed pharmacist or doctor.
          </p>
        </div>
      )}
    </div>
  );
}

export default PrescriptionScanner;