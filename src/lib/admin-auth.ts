const ADMIN_PASSCODE = process.env.REPORTS_UPLOAD_PASSCODE;

export function checkPasscode(passcode: unknown): boolean {
  if (!ADMIN_PASSCODE) return false;
  return typeof passcode === "string" && passcode.length > 0 && passcode === ADMIN_PASSCODE;
}
