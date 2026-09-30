export type Role = "ADMIN" | "SALES_MANAGER" | "SALESPERSON";

// ─── Permission Types ───────────────────────────────────────────────────────

export type Action =
  | "view_all_leads"
  | "create_lead"
  | "edit_any_lead"
  | "delete_lead"
  | "assign_lead"
  | "view_all_contacts"
  | "create_contact"
  | "edit_any_contact"
  | "delete_contact"
  | "view_all_companies"
  | "create_company"
  | "edit_any_company"
  | "delete_company"
  | "manage_deals"
  | "view_all_deals"
  | "delete_deal"
  | "manage_tasks"
  | "manage_users"
  | "view_reports"
  | "change_settings"
  | "view_audit_log"
  | "manage_automation";

export type Resource = "lead" | "contact" | "company" | "deal" | "task" | "user" | "report" | "settings" | "audit_log" | "automation";

export type PermissionLevel = "all" | "team" | "own" | false;

// ─── Permission Matrix ──────────────────────────────────────────────────────

const PERMISSION_MATRIX: Record<Action, Record<Role, PermissionLevel>> = {
  // Leads
  view_all_leads:    { ADMIN: "all", SALES_MANAGER: "team", SALESPERSON: "own" },
  create_lead:       { ADMIN: "all", SALES_MANAGER: "all",  SALESPERSON: "all" },
  edit_any_lead:     { ADMIN: "all", SALES_MANAGER: "team", SALESPERSON: "own" },
  delete_lead:       { ADMIN: "all", SALES_MANAGER: false,  SALESPERSON: false },
  assign_lead:       { ADMIN: "all", SALES_MANAGER: "all",  SALESPERSON: false },

  // Contacts
  view_all_contacts: { ADMIN: "all", SALES_MANAGER: "all",  SALESPERSON: "all" },
  create_contact:    { ADMIN: "all", SALES_MANAGER: "all",  SALESPERSON: "all" },
  edit_any_contact:  { ADMIN: "all", SALES_MANAGER: "team", SALESPERSON: "own" },
  delete_contact:    { ADMIN: "all", SALES_MANAGER: false,  SALESPERSON: false },

  // Companies
  view_all_companies:{ ADMIN: "all", SALES_MANAGER: "all",  SALESPERSON: "all" },
  create_company:    { ADMIN: "all", SALES_MANAGER: "all",  SALESPERSON: "all" },
  edit_any_company:  { ADMIN: "all", SALES_MANAGER: "team", SALESPERSON: "own" },
  delete_company:    { ADMIN: "all", SALES_MANAGER: false,  SALESPERSON: false },

  // Deals
  manage_deals:      { ADMIN: "all", SALES_MANAGER: "all",  SALESPERSON: "own" },
  view_all_deals:    { ADMIN: "all", SALES_MANAGER: "team", SALESPERSON: "own" },
  delete_deal:       { ADMIN: "all", SALES_MANAGER: false,  SALESPERSON: false },

  // Tasks
  manage_tasks:      { ADMIN: "all", SALES_MANAGER: "all",  SALESPERSON: "own" },

  // Users
  manage_users:      { ADMIN: "all", SALES_MANAGER: false,  SALESPERSON: false },

  // Reports
  view_reports:      { ADMIN: "all", SALES_MANAGER: "team", SALESPERSON: "own" },

  // Settings
  change_settings:   { ADMIN: "all", SALES_MANAGER: false,  SALESPERSON: false },

  // Audit Log
  view_audit_log:    { ADMIN: "all", SALES_MANAGER: false,  SALESPERSON: false },

  // Automation
  manage_automation: { ADMIN: "all", SALES_MANAGER: false,  SALESPERSON: false },
};

// ─── Permission Checker ─────────────────────────────────────────────────────

interface UserContext {
  id: string;
  role: Role;
}

/**
 * Check if a user can perform an action.
 * Returns the permission level ("all", "team", "own") or false.
 *
 * Usage in Server Actions:
 *   const level = can(user, "edit_any_lead");
 *   if (!level) throw new Error("Unauthorized");
 *   // Use level to build WHERE clause:
 *   // "own" → assignedUserId: user.id
 *   // "team" → future: filter by team
 *   // "all" → no filter
 */
export function can(user: UserContext, action: Action): PermissionLevel {
  const actionPerms = PERMISSION_MATRIX[action];
  if (!actionPerms) return false;
  return actionPerms[user.role] ?? false;
}

/**
 * Throws an error if the user cannot perform the action.
 * Use at the top of Server Actions for a clean guard pattern.
 */
export function authorize(user: UserContext, action: Action): PermissionLevel {
  const level = can(user, action);
  if (!level) {
    throw new Error(`Unauthorized: ${user.role} cannot perform ${action}`);
  }
  return level;
}

/**
 * Build a Prisma `where` clause filter based on permission level.
 * For "own" → filters by assignedUserId
 * For "team" → currently same as "all" (expand later with team model)
 * For "all" → returns empty filter (no restriction)
 */
export function buildOwnershipFilter(
  level: PermissionLevel,
  userId: string,
  ownerField: string = "assignedUserId"
): Record<string, string> | Record<string, never> {
  if (level === "own") {
    return { [ownerField]: userId };
  }
  // "team" and "all" return no filter for now
  // TODO: Add team-based filtering when Team model is added
  return {};
}
