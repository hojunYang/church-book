import Link from "next/link";

export default function NotFound() {
  return (
    <main className="landing">
      <section className="landing-card">
        <p className="eyebrow">404</p>
        <h1>가계부를 찾을 수 없어요</h1>
        <p>영문 소문자·숫자·하이픈으로 된 ID인지 확인해 주세요.</p>
        <Link className="primary-link" href="/">안내 화면으로</Link>
      </section>
    </main>
  );
}
