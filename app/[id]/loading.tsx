export default function Loading() {
  return (
    <main className="ledger-shell" aria-busy="true" aria-label="가계부 불러오는 중">
      <div className="skeleton skeleton-header" />
      <div className="skeleton skeleton-summary" />
      <div className="skeleton skeleton-row" />
      <div className="skeleton skeleton-row" />
      <div className="skeleton skeleton-row" />
    </main>
  );
}
