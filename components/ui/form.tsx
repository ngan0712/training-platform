"use client"

import * as React from "react"
import { Field } from "@base-ui/react/field"
import { Form as FormPrimitive } from "@base-ui/react/form"

import { cn } from "@/lib/utils"

function Form({ className, ...props }: FormPrimitive.Props) {
  return (
    <FormPrimitive
      data-slot="form"
      className={cn("space-y-4", className)}
      {...props}
    />
  )
}

function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="form-item"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function FormField({ className, ...props }: Field.Root.Props) {
  return (
    <Field.Root
      data-slot="form-field"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function FormLabel({ className, ...props }: Field.Label.Props) {
  return (
    <Field.Label
      data-slot="form-label"
      className={cn(
        "text-sm font-medium text-foreground group-has-disabled/field:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function FormControl({ className, ...props }: Field.Control.Props) {
  return (
    <Field.Control
      data-slot="form-control"
      className={cn(className)}
      {...props}
    />
  )
}

function FormDescription({ className, ...props }: Field.Description.Props) {
  return (
    <Field.Description
      data-slot="form-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function FormMessage({ className, ...props }: Field.Error.Props) {
  return (
    <Field.Error
      data-slot="form-message"
      className={cn("text-xs text-destructive", className)}
      {...props}
    />
  )
}

export {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
}
