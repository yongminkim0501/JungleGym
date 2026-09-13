import Link from "next/link";
import * as React from "react";

import { buttonStyles, type ButtonStyleProps } from "./button-styles";

export interface ButtonLinkProps
  extends React.ComponentPropsWithoutRef<typeof Link>,
    ButtonStyleProps {}

export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      className,
      ...props
    },
    ref,
  ) => (
    <Link
      ref={ref}
      className={buttonStyles({
        variant,
        size,
        fullWidth,
        className,
      })}
      {...props}
    />
  ),
);

ButtonLink.displayName = "ButtonLink";
