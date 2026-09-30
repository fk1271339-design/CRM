"use client";

import { useState, useTransition } from "react";
import {
  createContact,
  updateContact,
  deleteContact,
} from "@/actions/contacts";
import type { ContactInput } from "@/lib/validation/schemas";
import {
  UserCheck,
  Plus,
  Mail,
  Phone,
  Building2,
  Calendar,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  source: string | null;
  createdAt: Date | string;
  company?: { id: string; name: string } | null;
}

interface CompanyOption {
  id: string;
  name: string;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function ContactFormModal({
  contact,
  companies,
  isSaving,
  onClose,
  onSave,
}: {
  contact: Contact | null;
  companies: CompanyOption[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (data: ContactInput) => void;
}) {
  const [formData, setFormData] = useState({
    name: contact?.name ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    jobTitle: contact?.jobTitle ?? "",
    companyId: contact?.company?.id ?? "",
    source: contact?.source ?? "",
  });
  const isEdit = Boolean(contact);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      jobTitle: formData.jobTitle,
      companyId: formData.companyId,
      source: formData.source,
    });
  };

  const inputCls =
    "w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            {isEdit ? "Edit Contact" : "Create New Contact"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Job Title
              </label>
              <input
                type="text"
                placeholder="e.g. Procurement Manager"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Company
              </label>
              <select
                value={formData.companyId}
                onChange={(e) =>
                  setFormData({ ...formData, companyId: e.target.value })
                }
                className={inputCls}
              >
                <option value="">— No company —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Source
            </label>
            <input
              type="text"
              placeholder="e.g. Referral, Website, LinkedIn..."
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className={inputCls}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl shadow-lg shadow-cyan-500/25 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Save Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ContactsClient({
  initialContacts,
  companies,
  userRole,
}: {
  initialContacts: Contact[];
  companies: CompanyOption[];
  userRole: string;
}) {
  const [isPending, startTransition] = useTransition();

  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const canDelete = userRole === "ADMIN";

  const handleSaveContact = (data: ContactInput, contactId?: string) => {
    startTransition(async () => {
      try {
        if (contactId) {
          const result = await updateContact(contactId, data);
          setContacts((prev) =>
            prev.map((c) =>
              c.id === contactId
                ? (result.contact as unknown as Contact)
                : c
            )
          );
          toast.success("Contact updated successfully!");
        } else {
          const result = await createContact(data);
          setContacts((prev) => [
            result.contact as unknown as Contact,
            ...prev.filter((c) => c.id !== result.contact.id),
          ]);
          toast.success("Contact created successfully!");
        }
        setIsModalOpen(false);
        setEditingContact(null);
      } catch (err) {
        toast.error(
          getErrorMessage(
            err,
            contactId ? "Failed to update contact" : "Failed to create contact"
          )
        );
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    const prev = contacts;
    setContacts((list) => list.filter((c) => c.id !== id));
    try {
      await deleteContact(id);
      toast.success("Contact deleted successfully");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete contact"));
      setContacts(prev);
    }
  };

  const openCreate = () => {
    setEditingContact(null);
    setIsModalOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-cyan-400" />
            Contact Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Individual customer contacts across your client accounts.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 rounded-xl shadow-lg shadow-cyan-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="p-12 text-center text-slate-500 rounded-2xl bg-slate-900/60 border border-slate-800">
          No contacts yet. Add your first contact to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-3 hover:border-cyan-500/40 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                  {contact.name}
                </h3>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(contact)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                    title="Edit Contact"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-400 font-medium">
                {contact.jobTitle || "No Title"}
              </p>

              {contact.source && (
                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {contact.source}
                </span>
              )}

              <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                {contact.company && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{contact.company.name}</span>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{contact.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-600" />
                  <span>Added: {formatDate(contact.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog: Create / Edit Contact */}
      {isModalOpen && (
        <ContactFormModal
          contact={editingContact}
          companies={companies}
          isSaving={isPending}
          onClose={closeModal}
          onSave={(data) => handleSaveContact(data, editingContact?.id)}
        />
      )}
    </div>
  );
}