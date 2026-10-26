/** Keeps the original full-bleed desktop art; gives copy and art their own mobile space. */
export const IllustratedSection = ({ children, image, side = 'right', className = '', id, narrative = false, tone = '#035b46' }) => (
  <section
    id={id}
    className={`illustrated-section ${narrative ? 'illustrated-section--narrative' : ''} ${className}`}
    style={{ '--illustration-tone': tone }}
  >
    <div className={`illustrated-section__art illustrated-section__art--${side}`} aria-hidden="true">
      <img src={image} alt="" decoding="async" className="illustrated-section__image" />
    </div>
    {children}
  </section>
);
