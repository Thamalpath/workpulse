"use client";

import { useCallback, useRef, useState } from "react";

import {
  ConfirmDialog,
  type ConfirmDialogOptions,
} from "@/components/ui/confirm-dialog";

type Resolver = (value: boolean) => void;

/**
 * Promise-based confirmation dialog. Returns a `confirm(options)` function
 * that resolves with `true`/`false` when the dialog is confirmed or dismissed.
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ message: "Delete report?", destructive: true }))) return;
 */
function useConfirm() {
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const [open, setOpen] = useState(false);
  const resolverRef = useRef<Resolver>(() => {});

  const confirm = useCallback((opts: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOptions(opts);
      setOpen(true);
    });
  }, []);

  const resolve = useCallback((value: boolean) => {
    setOpen(false);
    resolverRef.current(value);
  }, []);

  const node = options ? (
    <ConfirmDialog
      open={open}
      options={options}
      onConfirm={() => resolve(true)}
      onCancel={() => resolve(false)}
    />
  ) : null;

  return [confirm, node] as const;
}

export { useConfirm };