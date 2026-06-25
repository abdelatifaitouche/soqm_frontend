import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { AlertCircle, Loader2 } from "lucide-react";

// ===================== VALIDATION =====================

const objectiveUpdateSchema = z.object({
  description: z.string().max(800).nullable().optional(),
});

// ===================== COMPONENT =====================

function ObjectiveEditDrawer({ objective, trigger, onSave }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(objectiveUpdateSchema),
    defaultValues: {
      description: "",
    },
  });

  const descriptionValue = watch("description") || "";

  // sync form with incoming data safely
  useEffect(() => {
    reset({
      description: objective?.description ?? "",
    });
  }, [objective?.id, reset]);

  const onSubmit = async (data) => {
    if (saving) return;

    setSaving(true);

    try {
      await onSave({
        description: data.description?.trim() || null,
      });

      toast.success("Objective updated successfully");

      setOpen(false);
      reset({
        description: data.description ?? "",
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Update failed";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>

      <DrawerContent className="w-[500px] ml-auto">
        <DrawerHeader className="border-b border-border">
          <DrawerTitle>Edit Objective</DrawerTitle>
          <DrawerDescription>
            Update objective information.
          </DrawerDescription>
        </DrawerHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {/* DESCRIPTION */}
          <div>
            <div className="flex justify-between">
              <label className="text-sm font-medium">
                Description
              </label>

              <span className="text-xs text-muted-foreground">
                {descriptionValue.length}/800
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

          {/* FOOTER */}
          <DrawerFooter className="border-t border-border">
            <button
              type="submit"
              disabled={saving}
              className="bg-black text-white px-4 py-2 rounded-lg text-xs disabled:opacity-60"
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

export default ObjectiveEditDrawer;