/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// apps/web/src/components/ui/input-otp.tsx
import * as React from "react"
import { OTPInput, SlotProps } from "input-otp"
import { cn } from "@/lib/utils"

//
// 1) Wrapper around the main OTPInput container
//
const InputOTP = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof OTPInput>
>(({ className, ...props }, ref) => (
  <OTPInput
    {...props}
    // cast to any to satisfy the library’s own typing
    ref={ref as any}
    containerClassName={cn("flex items-center gap-2", className)}
  />
))
InputOTP.displayName = "InputOTP"

//
// 2) Simple group container for the slots
//
const InputOTPGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    {...props}
    ref={ref}
    className={cn("flex items-center gap-2", className)}
  />
))
InputOTPGroup.displayName = "InputOTPGroup"

//
// 3) The individual slot.  Here we:
//    • Pull out the library’s slot-ref (so we can still pass it along)
//    • Omit placeholderChar so React stops warning
//    • Compose the slot-ref + forwarded ref into one “combinedRef”
//
type OTPInputSlotProps =
  & Omit<SlotProps, "ref" | "placeholderChar">
  & React.InputHTMLAttributes<HTMLInputElement>

const InputOTPSlot = React.forwardRef<
  HTMLInputElement,
  OTPInputSlotProps
>(({ char, hasFakeCaret, isActive, className, ...rest }, forwardedRef) => {
  // library actually hands you its ref in rest.ref
  const { ref: slotRef, placeholderChar, ...inputProps } = rest as any

  const combinedRef = (el: HTMLInputElement | null) => {
    // 1) let the library track its own ref
    if (typeof slotRef === "function") slotRef(el)
    else if (slotRef?.current !== undefined) slotRef.current = el

    // 2) let your forwardedRef track it too
    if (typeof forwardedRef === "function") forwardedRef(el)
    else if (forwardedRef?.current !== undefined) {
      ;(forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = el
    }
  }

  return (
    <div
      className={cn(
        "relative w-10 h-14 flex items-center justify-center border-2 rounded-md text-base transition-all duration-200",
        "border-border bg-background text-foreground",
        isActive && "ring-2 ring-offset-2 ring-primary",
        className
      )}
    >
      <input
        {...(inputProps as React.InputHTMLAttributes<HTMLInputElement>)}
        ref={combinedRef}
        className={cn(
          "w-full h-full text-center bg-transparent focus:outline-none focus:ring-0"
        )}
      />
      {char}
      {hasFakeCaret && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-caret-blink">
          <div className="w-px h-8 bg-foreground" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

export { InputOTP, InputOTPGroup, InputOTPSlot }
