import * as z from "zod";

// ─── Auth Schemas ───────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const signupSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .trim(),
  email: z.string().email({ message: "Please enter a valid email address" }).trim(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[a-zA-Z]/, { message: "Must contain at least one letter" })
    .regex(/[0-9]/, { message: "Must contain at least one number" })
    .regex(/[^a-zA-Z0-9]/, { message: "Must contain at least one special character" }),
  role: z.enum(["ADMIN", "SALES_MANAGER", "SALESPERSON"]).default("SALESPERSON"),
});

// ─── Lead Schemas ───────────────────────────────────────────────────────────

export const leadSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }).trim(),
  lastName: z.string().min(1, { message: "Last name is required" }).trim(),
  email: z.string().email({ message: "Invalid email" }).optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  companyName: z.string().optional().or(z.literal("")),
  jobTitle: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  source: z.string().min(1, { message: "Source is required" }),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"]).default("NEW"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  estimatedValue: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(0).optional()
  ),
  assignedUserId: z.string().optional().or(z.literal("")),
  nextFollowUpAt: z.coerce.date().optional().or(z.literal("")),
});

// ─── Contact Schemas ────────────────────────────────────────────────────────

export const contactSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).trim(),
  email: z.string().email({ message: "Invalid email" }).optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  jobTitle: z.string().optional().or(z.literal("")),
  companyId: z.string().optional().or(z.literal("")),
  source: z.string().optional().or(z.literal("")),
});

// ─── Company Schemas ────────────────────────────────────────────────────────

export const companySchema = z.object({
  name: z.string().min(1, { message: "Company name is required" }).trim(),
  website: z.string().url({ message: "Invalid URL" }).optional().or(z.literal("")),
  industry: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email({ message: "Invalid email" }).optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

// ─── Deal Schemas ───────────────────────────────────────────────────────────

export const dealSchema = z.object({
  name: z.string().min(1, { message: "Deal name is required" }).trim(),
  companyId: z.string().optional().or(z.literal("")),
  contactId: z.string().optional().or(z.literal("")),
  value: z.preprocess(
    (v) => (v === "" || v == null ? 0 : Number(v)),
    z.number().min(0, { message: "Value must be positive" })
  ),
  probability: z.preprocess(
    (v) => (v === "" || v == null ? 10 : Number(v)),
    z.number().min(0).max(100).default(10)
  ),
  stage: z.enum(["NEW", "CONTACTED", "QUALIFIED", "MEETING", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"]).default("NEW"),
  lostReason: z.string().optional().or(z.literal("")),
  expectedCloseDate: z.coerce.date().optional(),
  assignedUserId: z.string().optional().or(z.literal("")),
  source: z.string().optional().or(z.literal("")),
});

// ─── Task Schemas ───────────────────────────────────────────────────────────

export const taskSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }).trim(),
  description: z.string().optional().or(z.literal("")),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("PENDING"),
  assignedUserId: z.string().optional().or(z.literal("")),
  leadId: z.string().optional().or(z.literal("")),
  contactId: z.string().optional().or(z.literal("")),
  dealId: z.string().optional().or(z.literal("")),
});

// ─── Note Schemas ───────────────────────────────────────────────────────────

export const noteSchema = z.object({
  content: z.string().min(1, { message: "Note content is required" }),
  leadId: z.string().optional().or(z.literal("")),
  contactId: z.string().optional().or(z.literal("")),
  companyId: z.string().optional().or(z.literal("")),
  dealId: z.string().optional().or(z.literal("")),
});

// ─── Lead Detail / Conversion Schemas ───────────────────────────────────────

export const convertLeadSchema = z.object({
  companyName: z.string().min(1, { message: "Company name is required" }).trim(),
  companyWebsite: z.string().url({ message: "Invalid URL" }).optional().or(z.literal("")),
  industry: z.string().optional().or(z.literal("")),
  dealName: z.string().min(1, { message: "Deal name is required" }).trim(),
  dealValue: z.preprocess(
    (v) => (v === "" || v == null ? 0 : Number(v)),
    z.number().min(0, { message: "Deal value must be positive" })
  ),
  probability: z.preprocess(
    (v) => (v === "" || v == null ? 20 : Number(v)),
    z.number().min(0).max(100).default(20)
  ),
  expectedCloseDate: z.coerce.date().optional(),
});

export const leadActivitySchema = z.object({
  type: z.enum(["CALL", "EMAIL", "MEETING", "NOTE", "WHATSAPP"]).default("CALL"),
  title: z.string().min(1, { message: "Activity title is required" }).trim(),
  description: z.string().optional().or(z.literal("")),
  nextAction: z.string().optional().or(z.literal("")),
  nextFollowUpAt: z.coerce.date().optional().or(z.literal("")),
});

// ─── Type Exports ───────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
export type DealInput = z.infer<typeof dealSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
export type LeadActivityInput = z.infer<typeof leadActivitySchema>;
