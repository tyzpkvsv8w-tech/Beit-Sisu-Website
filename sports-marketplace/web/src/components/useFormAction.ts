"use client";

import { useActionState, startTransition } from "react";
import type { FormState } from "@/app/actions/auth";

/**
 * Runs a server action from onSubmit instead of the form's action prop.
 * React resets uncontrolled forms after an action prop runs, which would wipe
 * what the user typed whenever we show a validation error.
 */
export function useFormAction(action: (prev: FormState, form: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState(action, undefined);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
  return { state, onSubmit, pending };
}
