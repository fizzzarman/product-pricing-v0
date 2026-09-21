"use client";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/layout/locale-provider";

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(locale === "en" ? "bn" : "en")}
      aria-label="Toggle language"
      className="font-medium"
    >
      {locale === "en" ? "বাং" : "EN"}
    </Button>
  );
}
