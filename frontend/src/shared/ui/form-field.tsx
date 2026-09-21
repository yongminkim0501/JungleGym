import * as React from "react";

import { cn } from "@/shared/lib";

export interface FormFieldProps {
  label: React.ReactNode;
  htmlFor: string;
  error?: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

type FieldElementProps = {
  id?: string;
  children?: React.ReactNode;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

function withFieldAccessibility(
  node: React.ReactNode,
  htmlFor: string,
  describedBy: string | undefined,
  hasError: boolean,
): React.ReactNode {
  if (!React.isValidElement<FieldElementProps>(node)) {
    return node;
  }

  if (node.props.id === htmlFor) {
    return React.cloneElement(node, {
      ...(describedBy
        ? {
            "aria-describedby": [node.props["aria-describedby"], describedBy]
              .filter(Boolean)
              .join(" "),
          }
        : {}),
      ...(hasError ? { "aria-invalid": true } : {}),
    });
  }

  if (!node.props.children) {
    return node;
  }

  const children = React.Children.map(node.props.children, (child) =>
    withFieldAccessibility(child, htmlFor, describedBy, hasError),
  );

  return React.cloneElement(node, { children });
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  const errorId = `${htmlFor}-error`;
  const hintId = `${htmlFor}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  const field = withFieldAccessibility(
    children,
    htmlFor,
    describedBy,
    Boolean(error),
  );

  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={htmlFor} className="block text-base text-neutral-900">
        {label}
      </label>
      {field}
      {error ? (
        <p id={errorId} className="text-sm font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-neutral-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
