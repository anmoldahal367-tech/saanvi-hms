import './Card.css';

/**
 * Generic content container with consistent padding/border/shadow.
 * Pass `title` + `actions` for a card with a header row, or just
 * children for a plain panel.
 */
export default function Card({ title, actions, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="card__header">
          {title && <h3 className="card__title">{title}</h3>}
          {actions && <div className="card__actions">{actions}</div>}
        </div>
      )}
      <div className="card__body">{children}</div>
    </div>
  );
}
