import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  compact?: boolean;
};

export function Logo({ compact = false }: LogoProps) {
  return (
    <Link
      href="/"
      className="flex items-center gap-3"
      aria-label="Longstory Short Story home"
    >
      <span
        className={[
          "relative block overflow-hidden bg-black",
          compact ? "h-10 w-44" : "h-12 w-52 sm:w-64",
        ].join(" ")}
      >
        <Image
          src="/logo-cropped.png"
          alt="Longstory Short Story"
          fill
          unoptimized
          sizes={compact ? "176px" : "(min-width: 640px) 256px, 208px"}
          className="logo-on-dark h-full w-full object-contain"
        />
      </span>
    </Link>
  );
}
