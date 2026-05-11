"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "./utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-10 shrink-0 items-center rounded-full border border-gray-300 bg-gray-300 shadow-sm transition-all outline-none data-[state=checked]:border-green-500 data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300 focus-visible:border-green-500 focus-visible:ring-[3px] focus-visible:ring-green-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-500 dark:data-[state=unchecked]:bg-gray-600",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 dark:data-[state=unchecked]:bg-white dark:data-[state=checked]:bg-white",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
