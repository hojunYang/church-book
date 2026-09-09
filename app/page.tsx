import { BookOpen } from "lucide-react";

export default function HomePage() {
  return (
    <main className="landing">
      <section className="landing-card">
        <div className="landing-icon" aria-hidden="true"><BookOpen /></div>
        <p className="eyebrow">PRIVATE LEDGER</p>
        <h1>한달 가계부</h1>
        <p>원하는 영문 ID를 주소에 넣어 가계부를 열어 주세요.</p>
        <code>/my-church</code>
        <small>링크를 아는 사람은 해당 가계부를 조회하고 수정할 수 있습니다.</small>
      </section>
    </main>
  );
}
