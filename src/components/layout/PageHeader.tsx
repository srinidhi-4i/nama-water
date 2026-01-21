import { PageHeaderProps } from "@/types/page.header";
import Link from "next/link";


export default function PageHeader({
  language,
  titleEn,
  titleAr,
  breadcrumbEn,
  breadcrumbAr,
  showShadow = true,
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-4  ${
        showShadow ? "shadow-md" : ""
      }`}
    >
      {/* Title */}
      <div className="flex items-center gap-4 text-center sm:text-left h-12">
        <h1 className="text-2xl font-bold text-[#006A72]">
          {language === "EN" ? titleEn : titleAr}
        </h1>
      </div>

      {/* Breadcrumb */}
      <div className="text-sm text-gray-500">
        <Link
          href="/branchhome"
          className="font-semibold text-[#006A72] hover:underline cursor-pointer"
        >
          {language === "EN" ? "Home" : "الرئيسية"}
        </Link>
        <span>
          {" "}
          &gt; {language === "EN" ? breadcrumbEn : breadcrumbAr}
        </span>
      </div>
    </div>
  );
}
