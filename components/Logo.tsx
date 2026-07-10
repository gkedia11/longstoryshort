import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  compact?: boolean;
};

export function Logo({ compact = false }: LogoProps) {
  return (
    <Link
      href="/"
      className="logo-link flex items-center gap-2.5 rounded-md bg-[#07110d]/20 px-1.5 py-1 backdrop-blur-[1px] transition duration-200 hover:-translate-y-0.5 hover:scale-[1.025] sm:gap-3 sm:px-2"
      aria-label="Longstory Short Story home"
    >
      <span
        className={[
          "relative block shrink-0 overflow-hidden",
          compact ? "h-9 w-9" : "h-9 w-9 sm:h-12 sm:w-12",
        ].join(" ")}
      >
        <Image
          src="/brand-logo-mark-small.png"
          alt="Longstory Short Story"
          fill
          unoptimized
          sizes={compact ? "36px" : "(min-width: 640px) 48px, 36px"}
          className="brand-logo-mark h-full w-full object-contain transition duration-200"
        />
      </span>
      <span
        className={[
          "leading-none tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]",
          compact ? "text-sm font-semibold" : "text-sm font-bold sm:text-lg",
        ].join(" ")}
      >
        Longstory
        <span className="block text-[#d9b56c]">Short Story</span>
      </span>
    </Link>
  );
}
