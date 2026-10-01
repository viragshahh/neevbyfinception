const ADMIN_PASSCODE = process.env.REPORTS_UPLOAD_PASSCODE || "finception2026";

export function checkPasscode(passcode: unknown): boolean {
  return typeof passcode === "string" && passcode === ADMIN_PASSCODE;
}
