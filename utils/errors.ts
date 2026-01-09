export class QuotaExceededError extends Error {
  constructor(public limit: number, public quotaType: string) {
    super(`QUOTA_EXCEEDED:${quotaType}:${limit}`);
    this.name = "QuotaExceededError";
  }
}
