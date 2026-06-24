type ClassValue = string | number | null | boolean | undefined | ClassValue[];

function flatten(value: ClassValue, out: string[]) {
  if (!value) return;
  if (Array.isArray(value)) {
    for (const v of value) flatten(v, out);
    return;
  }
  out.push(String(value));
}

export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  flatten(values, out);
  return out.join(" ");
}
