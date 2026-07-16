import { SVGProps } from "@/types/svg";
import * as React from "react";

/**
 * The nqlib family mark (the nqui logo), drawn in its native 395,246 250x235 box.
 *
 * Copied from @nqlib/nqui rather than imported — same rule as the motion tokens:
 * nqchart must not take an @nqlib/nqui dependency. If the family mark changes
 * upstream, re-copy the paths.
 *
 * The transform maps that native box into a 48x48 frame at a uniform 0.192 scale
 * (48/250), centred vertically (235 * 0.192 = 45.12, so 1.44 of padding a side).
 * Keeping the paths untouched means an upstream re-copy is a straight paste.
 *
 * Fill is `currentColor` so callers keep controlling it with `text-*`, which is
 * what every call site already does.
 */
function NQChartMarkPaths() {
  return (
    <g
      transform="translate(0 1.44) scale(0.192) translate(-395 -246)"
      fill="currentColor"
    >
      <path d="M469.108582,314.094421 C431.519775,349.843567 439.122101,411.045959 484.146210,435.450684 C502.171906,445.221313 521.469482,447.166870 541.256226,441.475830 C545.471863,440.263367 547.134644,441.030762 548.303101,445.304016 C550.528503,453.442261 555.354675,459.913788 562.493469,464.605347 C564.263489,465.768524 566.397522,466.517853 568.055725,469.091949 C556.050537,475.584198 543.065369,478.190948 529.968201,479.123474 C497.323944,481.447784 467.867676,472.398834 444.312469,449.414490 C403.608948,409.697510 395.680359,346.476105 436.406464,297.996155 C475.279724,251.721817 544.115112,246.477859 590.704956,285.444122 C635.379639,322.808655 638.261658,382.546051 618.338745,418.410095 C616.854187,418.492645 616.366394,417.300507 615.859192,416.307098 C611.268799,407.316498 603.882874,401.705200 594.392517,398.821960 C590.888611,397.757385 590.128479,396.392303 591.394226,392.723419 C606.954346,347.621429 575.207275,299.471710 527.504639,295.046631 C506.985657,293.143188 489.039612,298.583160 473.064606,311.288971 C471.893860,312.220123 470.618286,313.019470 469.108582,314.094421z" />
      <path d="M593.982666,457.325623 C583.754761,460.901459 574.313049,460.242737 566.486389,453.005005 C559.045959,446.124390 556.946228,437.069031 559.390625,427.326324 C562.109497,416.489594 571.553589,409.327942 582.816895,408.892883 C593.566772,408.477661 603.659607,415.546509 607.333923,426.064240 C610.974915,436.486603 607.240601,448.385864 598.225220,454.921265 C597.019531,455.795288 595.650269,456.443542 593.982666,457.325623z" />
      <path d="M533.232910,400.182800 C530.269165,386.997559 541.695129,380.218018 550.155518,382.393341 C556.898743,384.127197 561.092590,389.064728 561.182373,395.883392 C561.275269,402.941345 557.406433,408.373291 551.013428,410.160553 C544.327759,412.029602 537.778931,409.345886 534.479309,403.338959 C534.004517,402.474640 533.726135,401.502411 533.232910,400.182800z" />
      <path d="M524.728027,358.949982 C531.395996,362.535034 533.603821,367.287964 531.735352,373.342438 C530.086304,378.685913 525.263184,381.813538 519.457153,381.304413 C514.137268,380.837952 509.808044,376.555115 508.974762,370.934296 C507.736542,362.582214 514.438599,357.313141 524.728027,358.949982z" />
    </g>
  );
}

/** The nqlib family mark, sized to a square frame. */
export function NQChartMark({
  width = "48",
  height = "48",
  ...props
}: SVGProps & { width?: string; height?: string }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <NQChartMarkPaths />
    </svg>
  );
}

const NQChartWordmark = ({
  width = "220",
  height = "48",
  ...props
}: SVGProps & { width?: string; height?: string }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 220 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="NQChart"
    {...props}
  >
    <NQChartMarkPaths />
    <text
      x="58"
      y="32"
      fill="currentColor"
      fontFamily="var(--font-geist-sans, system-ui, sans-serif)"
      fontSize="20"
      fontWeight="600"
      letterSpacing="-0.02em"
    >
      NQChart
    </text>
  </svg>
);

export default NQChartWordmark;
