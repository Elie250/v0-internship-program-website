import Link from 'next/link'
import { loadPublicCompanyProfile } from '@/lib/platform/site-settings'

export async function SiteFooter() {
  const profile = await loadPublicCompanyProfile()

  return (
    <footer className="text-on-dark bg-[#152a45] border-t border-white/10 px-4 py-12">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-bold text-lg mb-1">{profile.brandName}</h3>
          <p className="text-xs text-slate-300 mb-3">{profile.platformName} platform</p>
          <p className="text-sm text-slate-200 leading-relaxed">
            {profile.tagline} — based in {profile.address}.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-white">Portals</h4>
          <ul className="space-y-2 text-sm text-slate-200">
            <li><Link href="/learning">Learning</Link></li>
            <li><Link href="/shop">Shop</Link></li>
            <li><Link href="/career">Career</Link></li>
            <li><Link href="/internship">Internship</Link></li>
            <li><Link href="/engineering-support">Engineering Support</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-white">Company</h4>
          <ul className="space-y-2 text-sm text-slate-200">
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/payment-instructions">Payment Instructions</Link></li>
            <li><Link href="/auth/register">Create Account</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-white">Contact</h4>
          <ul className="space-y-2 text-sm text-slate-200">
            <li>
              <a href={`tel:${profile.phone}`}>{profile.phoneDisplay}</a>
            </li>
            <li>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </li>
            <li>{profile.address}</li>
            <li className="pt-1">
              <a
                href={`https://wa.me/${profile.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                WhatsApp us
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-white/15 mt-8 pt-6 text-center text-sm text-slate-300">
        © {new Date().getFullYear()} {profile.legalName}. All rights reserved.
      </div>
    </footer>
  )
}
