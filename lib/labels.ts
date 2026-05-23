import type {
  LoanStatus,
  DepositStatus,
  UserRole,
  UserStatus,
  ToolStatus,
} from "@prisma/client";

export const USER_ROLE: Record<UserRole, string> = {
  REGULAR: "משתמש",
  GEMACH_MANAGER: "מנהל גמח",
  ADMIN: "מנהל ראשי",
};

export const USER_STATUS: Record<UserStatus, string> = {
  PENDING: "ממתין לאישור",
  APPROVED: "מאושר",
  REJECTED: "נדחה",
  SUSPENDED: "מושעה",
};

export const LOAN_STATUS: Record<LoanStatus, string> = {
  PENDING: "ממתינה לאישור",
  APPROVED: "אושרה",
  REJECTED: "נדחתה",
  ACTIVE: "פעילה",
  RETURNED: "הוחזר",
  OVERDUE: "באיחור",
  CANCELLED: "בוטלה",
};

export const DEPOSIT_STATUS: Record<DepositStatus, string> = {
  NONE: "לא נדרש",
  HELD: "נעול",
  RELEASED: "שוחרר",
  CHARGED: "נגבה",
};

export const TOOL_STATUS: Record<ToolStatus, string> = {
  AVAILABLE: "פנוי",
  LOANED: "מושאל",
  MAINTENANCE: "בתחזוקה",
  INACTIVE: "לא פעיל",
};
