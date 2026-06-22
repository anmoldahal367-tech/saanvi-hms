import './Input.css';

/**
 * Reusable form input with built-in label and error message slot.
 *
 * <Input label="Email" type="email" value={email} onChange={...} error={errors.email} />
 */
export default function Input({
  label,
  id,
  error,
  hint,
  required = false,
  as = 'input',
  ...rest
}) {
  const inputId = id || `field-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  const Component = as;

  return (
    <div className="field">
      {label && (
        <label htmlFor={inputId} className="field__label">
          {label}
          {required && <span className="field__required"> *</span>}
        </label>
      )}
      <Component
        id={inputId}
        className={`field__control ${error ? 'field__control--error' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {hint && !error && <p className="field__hint">{hint}</p>}
      {error && (
        <p id={`${inputId}-error`} className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
