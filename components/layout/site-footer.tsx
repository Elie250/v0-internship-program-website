import Link from 'next/link'
import { COMPANY } from '@/lib/company/constants'

export function SiteFooter() {
  return (
    <footer className="bg-[#1e3a5f] text-white px-4 py-12">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-bold text-lg mb-1">{COMPANY.brandName}</h3>
          <p className="text-xs text-white/60 mb-3">{COMPANY.platformName} platform</p>
          <p className="text-sm text-white/70 leading-relaxed">
            Hands-on engineering training in embedded systems, industrial control, and electrical
            technology — based in {COMPANY.address}.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Portals</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="/learning" className="hover:text-white">Learning</Link></li>
            <li><Link href="/shop" className="hover:text-white">Shop</Link></li>
            <li><Link href="/career" className="hover:text-white">Career</Link></li>
            <li><Link href="/internship" className="hover:text-white">Internship</Link></li>
            <li><Link href="/engineering-support" className="hover:text-white">Engineering Support</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="/about" className="hover:text-white">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/payment-instructions" className="hover:text-white">Payment Instructions</Link></li>
            <li><Link href="/auth/register" className="hover:text-white">Create Account</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Contact</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li>
              <a href={`tel:${COMPANY.phone}`} className="hover:text-white">{COMPANY.phoneDisplay}</a>
            </li>
            <li>
              <a href={`mailto:${COMPANY.email}`} className="hover:text-white">{COMPANY.email}</a>
            </li>
            <li>{COMPANY.address}</li>
            <li className="pt-1">
              <a
                href={`https://wa.me/${COMPANY.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white underline"
              >
                WhatsApp us
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-white/10 mt-8 pt-6 text-center text-sm text-white/60">
        © {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.
      </div>
    </footer>
  )
}
