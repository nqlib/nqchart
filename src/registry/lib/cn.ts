import { clsx, type ClassValue } from "clsx";

/** Registry-local `cn` — clsx only. `tailwind-merge` is ~8 KB gzip and is not needed
 *  for the controlled class strings in chart chrome. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
