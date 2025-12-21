"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type Language = "EN" | "AR"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextType>({
  language: "EN",
  setLanguage: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("EN")

  // Load language from localStorage if available
  useEffect(() => {
    const savedLang = localStorage.getItem("preferredLanguage") as Language
    if (savedLang && (savedLang === "EN" || savedLang === "AR")) {
      setLanguage(savedLang)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("preferredLanguage", lang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
      <div dir={language === "AR" ? "rtl" : "ltr"} className="min-h-screen">
        {children}
      </div>
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
