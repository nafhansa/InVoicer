import { cx } from "@/lib/utils";

/** Wordmark inspired by the HMIF stripe motif. */
export function Logo({ dark, className }: { dark?: boolean; className?: string }) {
  return (
    <div className={cx("flex items-center gap-2.5", className)}>
      <div className={cx("grid h-9 w-9 place-items-center rounded-md border-2", dark ? "border-hmif bg-hmif" : "border-ink bg-hmif")}>
        <div className="flex w-5 flex-col gap-[3px]">
          <span className="h-[3px] w-full bg-ink" />
          <span className="h-[3px] w-3/4 bg-ink" />
          <span className="h-[3px] w-full bg-ink" />
          <span className="h-[3px] w-1/2 bg-ink" />
        </div>
      </div>
      <div className="leading-none">
        <div className={cx("font-display text-xl font-black tracking-tight", dark ? "text-white" : "text-ink")}>
          In<span className={dark ? "text-hmif" : "bg-ink px-0.5 text-hmif"}>V</span>oicer
        </div>
        <div className={cx("mt-0.5 text-[9px] font-bold uppercase tracking-[.2em]", dark ? "text-hmif" : "text-neutral-500")}>HMIF ITB</div>
      </div>
    </div>
  );
}
