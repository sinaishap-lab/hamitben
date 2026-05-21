import type {
  LoanStatus,
  DepositStatus,
  UserRole,
  UserStatus,
  ToolCategory,
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

export const TOOL_CATEGORY: Record<ToolCategory, string> = {
  IRRIGATION: "השקיה",
  HARVESTING: "קציר ואסיף",
  SOIL_WORK: "עיבוד קרקע",
  SPRAYING: "ריסוס",
  PLANTING: "שתילה",
  STORAGE: "אחסון",
  VEHICLES: "רכבים",
  HAND_TOOLS: "כלי יד",
  OTHER: "אחר",
};

export const TOOL_STATUS: Record<ToolStatus, string> = {
  AVAILABLE: "פנוי",
  LOANED: "מושאל",
  MAINTENANCE: "בתחזוקה",
  INACTIVE: "לא פעיל",
};
