export const SCHOOLS: { code: string; label: string }[] = [
  { code: "SoICT", label: "School of Information & Communication Technology" },
  { code: "SEEE", label: "School of Electrical & Electronic Engineering" },
  { code: "SME", label: "School of Economics & Management" },
  { code: "SET", label: "School of Engineering Technology" },
  { code: "SChEM", label: "School of Chemistry & Life Sciences" },
  { code: "SMSE", label: "School of Materials Science & Engineering" },
  { code: "SBME", label: "School of Biomedical Engineering" },
  { code: "FoMath", label: "Faculty of Mathematics & Informatics" },
  { code: "FoPhysics", label: "Faculty of Physics Engineering" },
  { code: "Other", label: "Other" },
];

export const PICKUP_LOCATIONS = [
  "Ta Quang Buu Library Counter",
  "Le Thanh Nghi Gate Store",
  "C1 Building Kiosk",
  "D3-5 Student Service Point",
];

export function schoolLabel(code: string) {
  return SCHOOLS.find((s) => s.code === code)?.label ?? code;
}

export function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}
