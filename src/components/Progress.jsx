export default function Progress({ index, total }) {
  return (
    <div className="progress">
      <span className="progress-text" aria-label={`${total}문제 중 ${index}번째 문제`}>
        Q. {index} / {total}
      </span>
      <div className="progress-bar" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${(index / total) * 100}%` }} />
      </div>
    </div>
  );
}
