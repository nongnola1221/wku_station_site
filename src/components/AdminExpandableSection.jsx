import { ChevronDown, ChevronUp } from 'lucide-react'

export function AdminExpandableSection({ title, description, open, onToggle, children }) {
  return (
    <section className="panel admin-expandable">
      <button type="button" className="admin-expandable__header" onClick={onToggle}>
        <div>
          <p className="section-heading__eyebrow">{title}</p>
          <h2>{description}</h2>
        </div>
        <span className="admin-expandable__icon">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      {open ? <div className="admin-expandable__body">{children}</div> : null}
    </section>
  )
}
