"use client"

import { Facebook, Twitter, Linkedin, Instagram, Youtube, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-stone-900 text-white py-6">
      <div className="container mx-auto px-4">
        {/* Social Media Icons */}
        <div className="flex justify-center gap-6 mb-4">
          <a href="#" className="hover:text-teal-400 transition-colors">
            <Facebook className="w-6 h-6" />
          </a>
          <a href="#" className="hover:text-teal-400 transition-colors">
            <Twitter className="w-6 h-6" />
          </a>
          <a href="#" className="hover:text-teal-400 transition-colors">
            <Linkedin className="w-6 h-6" />
          </a>
          <a href="#" className="hover:text-teal-400 transition-colors">
            <Instagram className="w-6 h-6" />
          </a>
          <a href="#" className="hover:text-teal-400 transition-colors">
            <Youtube className="w-6 h-6" />
          </a>
          <a href="#" className="hover:text-teal-400 transition-colors">
            <Mail className="w-6 h-6" />
          </a>
        </div>

        {/* Copyright */}
        <div className="text-center text-sm text-gray-400">
          <p>(An ISO 9001: 2015, ISO 14001: 2015, ISO 45001: 2018 Certified Authority)</p>
          <p className="mt-1">Copyright ©2023. All rights reserved Nama Water Services, Sultanate of Oman</p>
        </div>
      </div>
    </footer>
  )
}
