"use client";

import { CircleAlert, RotateCcw } from "lucide-react";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="landing">
      <section className="landing-card">
        <div className="landing-icon danger" aria-hidden="true"><CircleAlert /></div>
        <h1>가계부를 불러오지 못했어요</h1>
        <p>데이터베이스 연결을 확인한 뒤 다시 시도해 주세요.</p>
        <button className="primary-link" type="button" onClick={retry}>
          <RotateCcw size={18} /> 다시 시도
        </button>
      </section>
    </main>
  );
}
