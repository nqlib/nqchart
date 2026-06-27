import { useMediaQuery } from "@/hooks/use-media-query";

const MOBILE_BREAKPOINT = 940;

export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}
