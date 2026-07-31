export const customerStoryStatuses = {
  story_submitted: {
    label: "Story submitted",
    message:
      "Your story has been submitted. We’re preparing your story plan and title.",
  },
  plan_ready: {
    label: "Story plan ready",
    message:
      "Your story plan and title are ready. We’re beginning your manuscript.",
  },
  writing_proofreading_complete: {
    label: "Writing complete",
    message:
      "Writing and proofreading are complete. Your finished manuscript will be ready shortly.",
  },
  ready: {
    label: "Manuscript ready",
    message: "Your finished manuscript is ready to download.",
  },
  delivered: {
    label: "Manuscript delivered",
    message: "Your finished manuscript is available to download.",
  },
} as const;

export type CustomerStoryStatus = keyof typeof customerStoryStatuses;

export type StoryStatusHistoryEntry = {
  status: string;
  message: string;
  at: string;
  source: "website" | "stripe" | "n8n" | "delivery";
};

const legacyStatusAliases: Record<string, CustomerStoryStatus> = {
  submitted: "story_submitted",
  sent_to_n8n: "story_submitted",
};

export function normalizeCustomerStoryStatus(
  status: string,
): CustomerStoryStatus | null {
  if (status in customerStoryStatuses) {
    return status as CustomerStoryStatus;
  }
  return legacyStatusAliases[status] ?? null;
}

export function customerStoryStatusLabel(status: string) {
  const normalized = normalizeCustomerStoryStatus(status);
  return normalized
    ? customerStoryStatuses[normalized].label
    : status.replaceAll("_", " ");
}

export function customerStoryStatusMessage(
  status: string,
  explicitMessage?: string | null,
) {
  if (explicitMessage?.trim()) return explicitMessage.trim();
  const normalized = normalizeCustomerStoryStatus(status);
  return normalized
    ? customerStoryStatuses[normalized].message
    : "Your order is being reviewed.";
}

export function isManuscriptReady(status: string) {
  const normalized = normalizeCustomerStoryStatus(status);
  return normalized === "ready" || normalized === "delivered";
}
