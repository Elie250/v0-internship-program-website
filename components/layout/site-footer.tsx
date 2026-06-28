import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="bg-[#1e3a5f] text-white px-4 py-12">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-bold text-lg mb-3">Engineering Hub</h3>
          <p className="text-sm text-white/70">
            Multi-portal engineering ecosystem for education, career development, support, and marketplace.
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
            <li><Link href="/auth/register" className="hover:text-white">Create Account</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Contact</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><a href="tel:+250783986252" className="hover:text-white">+250 783 986 252</a></li>
            <li><a href="mailto:info@energyandlogics.com" className="hover:text-white">info@energyandlogics.com</a></li>
            <li>Kigali, Rwanda</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-white/10 mt-8 pt-6 text-center text-sm text-white/60">
        © {new Date().getFullYear()} Engineering Hub — Energy & Logics. All rights reserved.
      </div>
    </footer>
  )
}
