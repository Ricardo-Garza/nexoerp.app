import { NexoLogo } from "@/components/brand/nexo-logo";

export function Logo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <NexoLogo className="flex-col text-center" textClassName="text-center" />
    </div>
  );
}
