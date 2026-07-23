import { useState } from "react";

export default function CopyIdButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard API can be unavailable (insecure context, permissions) -
      // the id is still shown as text next to the button either way.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" className="copy-id-btn" onClick={handleClick} title={value}>
      {copied ? "✓ copiado" : "Copiar id"}
    </button>
  );
}
