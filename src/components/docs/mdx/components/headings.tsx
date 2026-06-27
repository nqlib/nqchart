import React from "react";

import { LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const H1 = ({ className, children, ...props }: React.ComponentProps<"h1">) => (
  <h1
    className={cn(
      "font-heading mt-2 scroll-m-10 text-3xl font-bold tracking-tight select-none",
      className,
    )}
    {...props}
  >
    {children}
  </h1>
);

export const H2 = ({ className, children, ...props }: React.ComponentProps<"h2">) => {
  const headingId = children
    ?.toString()
    .replace(/ /g, "-")
    .replace(/'/g, "")
    .replace(/\?/g, "")
    .toLowerCase();
  const label = typeof children === "string" ? children : "section";
  return (
    <div className="group text-foreground relative">
      <a
        href={`#${headingId}`}
        aria-label={`Link to section: ${label}`}
        className="absolute top-0 -left-11 hidden size-11 items-center justify-center rounded-md opacity-0 transition-opacity duration-200 ease-in-out hover:opacity-100 focus-visible:opacity-100 lg:flex"
      >
        <LinkIcon className="size-4" />
      </a>
      <h2
        id={headingId}
        className={cn(
          "font-heading [&+]*:[code]:text-xl mt-10 scroll-m-10 text-xl font-medium tracking-tight select-none first:mt-0 [&+.steps]:mt-0! [&+.steps>h3]:mt-4! [&+h3]:mt-6! [&+p]:mt-4!",
          className,
        )}
        {...props}
      >
        {children}
      </h2>
    </div>
  );
};
export const H3 = ({ className, children, ...props }: React.ComponentProps<"h3">) => (
  <h3
    className={cn(
      "font-heading text-foreground mt-8 scroll-m-10 text-base font-medium tracking-tight select-none [&+p]:mt-4! *:[code]:text-xl",
      className,
    )}
    {...props}
  >
    {children}
  </h3>
);

export const H4 = ({ className, children, ...props }: React.ComponentProps<"h4">) => (
  <h4
    className={cn(
      "font-heading text-foreground mt-8 scroll-m-10 text-base font-medium tracking-tight select-none",
      className,
    )}
    {...props}
  >
    {children}
  </h4>
);

export const H5 = ({ className, children, ...props }: React.ComponentProps<"h5">) => (
  <h5
    className={cn(
      "text-foreground mt-8 scroll-m-10 text-base font-medium tracking-tight select-none",
      className,
    )}
    {...props}
  >
    {children}
  </h5>
);

export const H6 = ({ className, children, ...props }: React.ComponentProps<"h6">) => (
  <h6
    className={cn(
      "text-foreground mt-8 scroll-m-10 text-base font-medium tracking-tight select-none",
      className,
    )}
    {...props}
  >
    {children}
  </h6>
);
