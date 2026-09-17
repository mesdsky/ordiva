"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CategoryType = "income" | "expense";

export type CreatedCategory = {
  id: string;
  name: string;
  type: CategoryType;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (category: CreatedCategory) => void;
  defaultType?: CategoryType;
  allowTypeSelection?: boolean;
};

export default function CategoryCreateModal({
  open,
  onClose,
  onCreated,
  defaultType = "expense",
  allowTypeSelection = true,
}: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>(defaultType);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setType(defaultType);
    setSaving(false);
    setErrorMessage("");
  }, [open, defaultType]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setErrorMessage("Category name must be at least 2 characters.");
      return;
    }

    if (trimmedName.length > 40) {
      setErrorMessage("Category name must be 40 characters or less.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMessage("Your session has expired. Please log in again.");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({
        user_id: user.id,
        name: trimmedName,
        type,
        icon: "•••",
        color: "#B8B8A8",
      })
      .select("id, name, type")
      .single();

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? "A category with this name already exists for this type."
          : error.message
      );
      setSaving(false);
      return;
    }

    if (!data) {
      setErrorMessage("Category could not be created. Please try again.");
      setSaving(false);
      return;
    }

    onCreated({
      id: String(data.id),
      name: String(data.name),
      type: data.type === "income" ? "income" : "expense",
    });

    setSaving(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#173C34]/30 px-5 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-category-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-[#F9F8F2] p-7 shadow-[0_30px_80px_rgba(23,60,52,0.18)] md:p-8">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#AFC1A4]/25 blur-3xl" />

        <div className="relative">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7B9685]">
                Personal category
              </p>
              <h2
                id="create-category-title"
                className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[#173C34]"
              >
                Create category
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#7B9685]">
                Your category will be available across Budget, Transactions,
                Reports, and Dashboard.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#DDE6D7] bg-white/60 text-sm text-[#5F7168] hover:bg-white disabled:opacity-50"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="custom-category-name"
                className="mb-2 block text-sm font-semibold text-[#173C34]"
              >
                Category name
              </label>
              <input
                id="custom-category-name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setErrorMessage("");
                }}
                placeholder="e.g. Gym, Coffee, Rent"
                maxLength={40}
                autoFocus
                required
                className="w-full rounded-2xl border border-[#DDE6D7] bg-white/70 px-4 py-3.5 text-sm text-[#173C34] outline-none focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
              />
              <p className="mt-2 text-xs text-[#8B9A92]">2–40 characters.</p>
            </div>

            {allowTypeSelection ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-[#173C34]">
                  Category type
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(["expense", "income"] as CategoryType[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setType(item)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                        type === item
                          ? "border-[#214F43] bg-[#E8EEDB] text-[#214F43]"
                          : "border-[#DDE6D7] bg-white/60 text-[#5F7168] hover:bg-[#E8EEDB]"
                      }`}
                    >
                      {item === "expense" ? "Expense" : "Income"}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#DDE6D7] bg-[#E8EEDB]/55 px-4 py-3">
                <p className="text-xs font-semibold text-[#214F43]">
                  Expense category
                </p>
                <p className="mt-1 text-xs text-[#7B9685]">
                  Budget categories are always for expenses.
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 rounded-2xl border border-[#DDE6D7] bg-white/60 px-5 py-3.5 text-sm font-semibold text-[#5F7168] hover:bg-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || name.trim().length < 2}
                className="flex-1 rounded-2xl bg-[#214F43] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[#173C34] disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create category"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
