import './Button.css';

const VARIANT_CLASS = {
  primary: 'btn btn--primary',
  secondary: 'btn btn--secondary',
  danger: 'btn btn--danger',
  ghost: 'btn btn--ghost',
};

/**
 * Reusable button. Use `variant` to pick the visual style and `isLoading`
 * to show a busy state while an action (save, delete, etc.) is in flight.
 *
 * <Button variant="danger" isLoading={deleting} onClick={handleDelete}>
 *   Delete patient
 * </Button>
 */
export default function Button({
  children,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  type = 'button',
  fullWidth = false,
  ...rest
}) {
  const className = `${VARIANT_CLASS[variant] || VARIANT_CLASS.primary} ${fullWidth ? 'btn--full' : ''}`;

  return (
    <button
      type={type}
      className={className}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading ? <span className="btn__spinner" aria-hidden="true" /> : null}
      <span className={isLoading ? 'btn__label--loading' : ''}>{children}</span>
    </button>
  );
}
