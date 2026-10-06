import useFocusOnMount from './useFocusOnMount.js';

export default function Home({ config, onStart }) {
  const titleRef = useFocusOnMount();
  return (
    <section className="screen home">
      <div className="home-hero">
        <span className="hero-emoji" aria-hidden="true">🌍</span>
        <h1 ref={titleRef} tabIndex={-1}>{config.title}</h1>
        <p className="subtitle">{config.subtitle}</p>
      </div>
      <p className="home-guide">난이도를 골라 {config.questionCount}문제에 도전해 보세요.</p>
      <div className="mode-list">
        {config.modes.map((mode) => (
          <button key={mode.id} type="button" className={`mode-card mode-${mode.id}`} onClick={() => onStart(mode.id)}>
            <span className="mode-emoji" aria-hidden="true">{mode.emoji}</span>
            <span className="mode-text">
              <span className="mode-label">{mode.label}</span>
              <span className="mode-desc">{mode.description}</span>
            </span>
            <span className="mode-count">{config.questionCount}문제</span>
          </button>
        ))}
      </div>
    </section>
  );
}
