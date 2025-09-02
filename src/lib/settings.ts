let autoReplyEnabled = false;

export function getAutoReplyEnabled(): boolean {
  return autoReplyEnabled;
}

export function setAutoReplyEnabled(enabled: boolean): void {
  autoReplyEnabled = enabled;
}
