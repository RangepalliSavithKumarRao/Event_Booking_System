import { useState } from 'react';

// Password field with a show / hide button
export default function PasswordInput({ id, value, onChange, autoComplete = 'current-password' }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw-wrap">
      <input id={id} type={show ? 'text' : 'password'} className="form-control" required value={value} onChange={onChange} autoComplete={autoComplete} />
      <button type="button" className="pw-toggle" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
