import type { ReactNode } from "react";

export interface ResultState {
  kind: "success" | "error";
  title: ReactNode;
  data?: unknown;
  extra?: ReactNode;
}

export default function ResultBox({ result }: { result: ResultState | null }) {
  if (!result) return <div className="result" />;

  return (
    <div className={`result result--${result.kind}`}>
      <p className="result__title">{result.title}</p>
      {result.extra}
      {result.data !== undefined && (
        <pre className="result__data">{JSON.stringify(result.data, null, 2)}</pre>
      )}
    </div>
  );
}
