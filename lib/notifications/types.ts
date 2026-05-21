// Shared notification types.

export type NotificationEvent =
  | "USER_REGISTERED"
  | "USER_APPROVED"
  | "LOAN_REQUESTED"
  | "LOAN_APPROVED"
  | "LOAN_REJECTED"
  | "LOAN_COLLECTED"
  | "LOAN_RETURN_REMINDER"
  | "LOAN_RETURNED_OK"
  | "LOAN_OVERDUE"
  | "WAITLIST_TURN"
  | "TOOL_REQUEST_CREATED"
  | "GEMACH_REQUEST_CREATED"
  | "TOOL_DONATION_REQUEST";

export type NotificationData = Record<string, string | number | undefined>;

/** Recipient profile snapshot used by all channels. */
export type Recipient = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

/** Per-channel rendered messages. */
export type RenderedMessage = {
  whatsapp: string;
  sms: string;
  email: { subject: string; body: string };
  push: { title: string; body: string; url?: string };
};
