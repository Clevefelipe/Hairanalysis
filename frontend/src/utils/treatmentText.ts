export function normalizePeriodText(value: string) {
  return (value || "")
    .replace(/a cada\s+(\d+)\s*[/-]\s*(\d+)\s+dias/gi, "a cada $1–$2 dias")
    .replace(/a cada\s+(\d+)\s+a\s+(\d+)\s+dias/gi, "a cada $1–$2 dias")
    .replace(/a cada\s+(\d+)\s+(\d+)\s+dias/gi, "a cada $1–$2 dias")
    .replace(/(\d+)\s*[/-]\s*(\d+)\s*dias/gi, "$1–$2 dias")
    .replace(/(\d+)\s+a\s+(\d+)\s*dias/gi, "$1–$2 dias")
    .replace(/(\d+)\s+(\d+)\s*dias/gi, "$1–$2 dias")
    .trim();
}

export function formatTreatmentCombo(input: string) {
  const parts = (input || "")
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  const formatted: string[] = [];

  for (let i = 0; i < parts.length; i += 1) {
    const current = parts[i];
    const next = parts[i + 1];

    if (next && /^frequ[êe]ncia/i.test(next)) {
      const period = normalizePeriodText(next.replace(/^frequ[êe]ncia\s*/i, ""));
      formatted.push(`${current} (${period || "frequência definida"})`);
      i += 1;
    } else {
      formatted.push(current);
    }
  }

  return formatted.join(" + ");
}

export function applyPeriodNormalization(text: string) {
  return normalizePeriodText(text || "");
}
