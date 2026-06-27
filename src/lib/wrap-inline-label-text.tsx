import * as React from "react";

/**
 * Ported from @nqlib/nqui. String/number children in `inline-flex` +
 * `whitespace-nowrap` rows keep an implicit min width and can paint outside a
 * shrinking parent. Wrap those nodes so `min-w-0 shrink truncate` works.
 */
export function wrapInlineLabelTextNodes(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child, i) => {
    if (child === null || child === false) return child;
    if (typeof child === "string" || typeof child === "number") {
      return (
        <span className="min-w-0 shrink truncate" key={`nqui-inline-lbl-${i}`}>
          {child}
        </span>
      );
    }
    if (React.isValidElement(child) && child.type === React.Fragment) {
      const { children: fragmentChildren } = child.props as { children?: React.ReactNode };
      return (
        <React.Fragment key={`nqui-inline-fr-${i}`}>
          {wrapInlineLabelTextNodes(fragmentChildren)}
        </React.Fragment>
      );
    }
    return child;
  });
}
