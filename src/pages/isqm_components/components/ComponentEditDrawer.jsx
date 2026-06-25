import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

// ===================== VALIDATION =====================

const componentUpdateSchema = z.object({
  name: z.string().min(3).max(100),
  isqm_reference: z.string().min(1).max(50),
  description: z.string().max(500).optional().nullable(),
});

// ===================== COMPONENT =====================

function ComponentEditDrawer({ component, trigger, onSave }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [feedback, setFeedback] = useState({
    type: null, // "success" | "error" | null
    message: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(componentUpdateSchema),
    defaultValues: {
      name: component?.name || "",
      isqm_reference: component?.isqm_reference || "",
      description: component?.description || "",
    },
  });

  const descriptionValue = watch("description") || "";

  // reset when component changes
  useEffect(() => {
    if (!component) return;

    reset({
      name: component.name || "",
      isqm_reference: component.isqm_reference || "",
      description: component.description || "",
    });
  }, [component, reset]);

  const onSubmit = async (data) => {
    if (saving || !isDirty) return;

    setSaving(true);
    setFeedback({ type: null, message: "" });

    try {
      await onSave({
        name: data.name,
        isqm_reference: data.isqm_reference,
        description: data.description || null,
      });

      setFeedback({
        type: "success",
        message: "Component updated successfully",
      });

      setTimeout(() => {
        setOpen(false);
        reset();
        setFeedback({ type: null, message: "" });
      }, 1200);
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err?.message || "Update failed",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>

      <DrawerContent className="w-[500px] ml-auto">
        <DrawerHeader className="border-b border-border">
          <DrawerTitle>Edit Component</DrawerTitle>
          <DrawerDescription>
            Update component information.
          </DrawerDescription>
        </DrawerHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {/* NAME */}
          <div>
            <label className="text-sm font-medium">Component Name</label>

            <input
              disabled={saving}
              {...register("name")}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />

            {errors.name && (
              <p className="text-xs text-red-600 flex gap-2 items-center">
                <AlertCircle size={14} />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* ISQM */}
          <div>
            <label className="text-sm font-medium">ISQM Reference</label>

            <input
              disabled={saving}
              {...register("isqm_reference")}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />

            {errors.isqm_reference && (
              <p className="text-xs text-red-600 flex gap-2 items-center">
                <AlertCircle size={14} />
                {errors.isqm_reference.message}
              </p>
            )}
          </div>

          {/* DESCRIPTION */}
          <div>
            <div className="flex justify-between">
              <label className="text-sm font-medium">Description</label>
              <span className="text-xs text-muted-foreground">
                {descriptionValue.length}/500
              </span>
            </div>

            <textarea
              rows={5}
              disabled={saving}
              {...register("description")}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            />

            {errors.description && (
              <p className="text-xs text-red-600 flex gap-2 items-center">
                <AlertCircle size={14} />
                {errors.description.message}
              </p>
            )}
          </div>

          {/* FEEDBACK */}
          {feedback.type === "success" && (
            <div className="flex gap-2 text-green-700 text-xs">
              <CheckCircle2 size={14} />
              {feedback.message}
            </div>
          )}

          {feedback.type === "error" && (
            <div className="flex gap-2 text-red-700 text-xs">
              <AlertCircle size={14} />
              {feedback.message}
            </div>
          )}

          {/* FOOTER */}
          <DrawerFooter className="border-t border-border">
            <button
              type="submit"
              disabled={!isDirty || saving}
              className="bg-black text-white px-4 py-2 rounded-lg text-xs"
            >
              {saving ? (
                <>
                  <Loader2 className="inline animate-spin mr-2" size={14} />
                  Saving
                </>
              ) : (
                "Update"
              )}
            </button>

            <DrawerClose asChild>
              <button
                type="button"
                disabled={saving}
                className="border px-4 py-2 rounded-lg text-xs"
              >
                Cancel
              </button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

export default ComponentEditDrawer;