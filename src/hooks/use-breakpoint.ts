import { useMediaQuery } from "@/hooks/use-media-query";

export function useBreakpoint(breakpoint: number) {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}
