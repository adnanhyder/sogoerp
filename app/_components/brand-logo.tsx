import Link from "next/link";
import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  href?: string;
};

export function BrandLogo({ className = "", href = "/dashboard" }: BrandLogoProps) {
  return (
    <Link className={`inline-flex items-center ${className}`} href={href}>
      <Image
        alt="SogoTrack"
        className="h-10 w-auto"
        height={150}
        priority
        src="/sogotrack-logo.svg"
        width={389}
      />
    </Link>
  );
}
