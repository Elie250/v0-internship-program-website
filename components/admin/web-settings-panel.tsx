'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DEFAULT_WEB_SETTINGS,
  type WebSettingsForm,
} from '@/lib/platform/site-settings-schema'
import { Building2, CreditCard, Globe, Home, ImageIcon, Save, User } from 'lucide-react'

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div>
      <Label className="text-slate-800">{label}</Label>
      <div className="mt-1">{children}</div>
      {hint ? <p className="text-xs text-slate-500 mt-1">{hint}</p> : null}
    </div>
  )
}

export default function WebSettingsPanel() {
  const [form, setForm] = useState<WebSettingsForm>(DEFAULT_WEB_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const logoFileRef = useRef<HTMLInputElement>(null)
  const heroFileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/settings', { credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load settings')
      setForm({ ...DEFAULT_WEB_SETTINGS, ...data, hero: { ...DEFAULT_WEB_SETTINGS.hero, ...data.hero } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const patch = <K extends keyof WebSettingsForm>(key: K, value: WebSettingsForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const patchHero = (key: keyof WebSettingsForm['hero'], value: string) => {
    setForm((prev) => ({ ...prev, hero: { ...prev.hero, [key]: value } }))
  }

  const uploadImage = async (file: File, folder: 'brand' | 'hero', onUrl: (url: string) => void) => {
    setUploading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('folder', folder)
      const res = await fetch('/api/admin/upload', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      onUrl(data.url)
      setMessage('Image uploaded — remember to save settings.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setMessage(data.message ?? 'Website settings saved. Refresh the public site to see changes.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-slate-600">Loading website settings…</p>
  }

  return (
    <div className="space-y-6 app-form-surface">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Website settings</h1>
          <p className="text-slate-600 mt-1">
            Manage company details, homepage, payments, and SEO for the whole public site.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || uploading}
          className="bg-[var(--brand-navy)] text-white shrink-0"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving…' : 'Save all settings'}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
      ) : null}
      {message ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">{message}</p>
      ) : null}

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList className="bg-white border border-slate-200 flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="company" className="data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white">
            <Building2 className="h-4 w-4 mr-1.5 hidden sm:inline" /> Company
          </TabsTrigger>
          <TabsTrigger value="hero" className="data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white">
            <Home className="h-4 w-4 mr-1.5 hidden sm:inline" /> Homepage
          </TabsTrigger>
          <TabsTrigger value="about" className="data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white">
            About
          </TabsTrigger>
          <TabsTrigger value="payment" className="data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white">
            <CreditCard className="h-4 w-4 mr-1.5 hidden sm:inline" /> Payments
          </TabsTrigger>
          <TabsTrigger value="founder" className="data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white">
            <User className="h-4 w-4 mr-1.5 hidden sm:inline" /> Founder
          </TabsTrigger>
          <TabsTrigger value="branding" className="data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white">
            <ImageIcon className="h-4 w-4 mr-1.5 hidden sm:inline" /> Brand & SEO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card className="border-slate-200">
            <CardHeader><CardTitle className="text-slate-900">Company & contact</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <Field label="Legal name">
                <Input value={form.company_legal_name} onChange={(e) => patch('company_legal_name', e.target.value)} />
              </Field>
              <Field label="Brand name (display)">
                <Input value={form.company_brand_name} onChange={(e) => patch('company_brand_name', e.target.value)} />
              </Field>
              <Field label="Platform name">
                <Input value={form.company_platform_name} onChange={(e) => patch('company_platform_name', e.target.value)} />
              </Field>
              <Field label="Slogan">
                <Input value={form.company_slogan} onChange={(e) => patch('company_slogan', e.target.value)} />
              </Field>
              <Field label="Tagline" hint="Short description used in meta and summaries">
                <Input value={form.company_tagline} onChange={(e) => patch('company_tagline', e.target.value)} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.company_email} onChange={(e) => patch('company_email', e.target.value)} />
              </Field>
              <Field label="Phone (tel link)">
                <Input value={form.company_phone} onChange={(e) => patch('company_phone', e.target.value)} placeholder="+250783986252" />
              </Field>
              <Field label="Phone (display)">
                <Input value={form.company_phone_display} onChange={(e) => patch('company_phone_display', e.target.value)} placeholder="+250 783 986 252" />
              </Field>
              <Field label="WhatsApp number" hint="Digits only, e.g. 250783986252">
                <Input value={form.company_whatsapp} onChange={(e) => patch('company_whatsapp', e.target.value)} />
              </Field>
              <Field label="Address">
                <Input value={form.company_address} onChange={(e) => patch('company_address', e.target.value)} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hero">
          <Card className="border-slate-200">
            <CardHeader><CardTitle className="text-slate-900">Homepage hero</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Headline">
                <Input value={form.hero.title} onChange={(e) => patchHero('title', e.target.value)} />
              </Field>
              <Field label="Subtitle">
                <Textarea rows={3} value={form.hero.subtitle} onChange={(e) => patchHero('subtitle', e.target.value)} />
              </Field>
              <Field
                label="Background image or video URL"
                hint="Use /videos/your-file.mp4 for local hero videos, or an image path like /hero-laboratory.jpg"
              >
                <Input value={form.hero.background_image} onChange={(e) => patchHero('background_image', e.target.value)} />
              </Field>
              <div>
                <Label className="text-slate-800">Upload hero image</Label>
                <Input
                  ref={heroFileRef}
                  type="file"
                  accept="image/*,video/mp4,video/webm"
                  className="mt-1"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void uploadImage(file, 'hero', (url) => patchHero('background_image', url))
                  }}
                />
                <p className="text-xs text-slate-500 mt-1">
                  For large hero videos, add the file to <code className="text-xs">public/videos/</code> and set the URL above (e.g. /videos/hero.mp4).
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Primary button label">
                  <Input value={form.hero.cta_primary_label} onChange={(e) => patchHero('cta_primary_label', e.target.value)} />
                </Field>
                <Field label="Primary button link">
                  <Input value={form.hero.cta_primary_url} onChange={(e) => patchHero('cta_primary_url', e.target.value)} />
                </Field>
                <Field label="Secondary button label">
                  <Input value={form.hero.cta_secondary_label} onChange={(e) => patchHero('cta_secondary_label', e.target.value)} />
                </Field>
                <Field label="Secondary button link">
                  <Input value={form.hero.cta_secondary_url} onChange={(e) => patchHero('cta_secondary_url', e.target.value)} />
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card className="border-slate-200">
            <CardHeader><CardTitle className="text-slate-900">About page content</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Who we are">
                <Textarea rows={8} value={form.about_content} onChange={(e) => patch('about_content', e.target.value)} />
              </Field>
              <Field label="Mission statement">
                <Textarea rows={6} value={form.mission_content} onChange={(e) => patch('mission_content', e.target.value)} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card className="border-slate-200">
            <CardHeader><CardTitle className="text-slate-900">Payment instructions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Payment method label">
                <Input value={form.payment_method_label} onChange={(e) => patch('payment_method_label', e.target.value)} />
              </Field>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="MTN MoMo Pay Code">
                  <Input value={form.payment_momo_code} onChange={(e) => patch('payment_momo_code', e.target.value)} />
                </Field>
                <Field label="Account name">
                  <Input value={form.payment_account_name} onChange={(e) => patch('payment_account_name', e.target.value)} />
                </Field>
              </div>
              <Field label="Payment workflow note" hint="Shown on payment cards and instructions">
                <Textarea rows={4} value={form.payment_workflow} onChange={(e) => patch('payment_workflow', e.target.value)} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="founder">
          <Card className="border-slate-200">
            <CardHeader><CardTitle className="text-slate-900">Founder (About page)</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <Field label="Founder name">
                <Input value={form.founder_name} onChange={(e) => patch('founder_name', e.target.value)} />
              </Field>
              <Field label="Founder title">
                <Input value={form.founder_title} onChange={(e) => patch('founder_title', e.target.value)} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Globe className="h-5 w-5" /> Logo & SEO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-lg border bg-white overflow-hidden">
                  <Image src={form.company_logo_url} alt="Logo preview" fill className="object-contain p-1" unoptimized />
                </div>
                <p className="text-sm text-slate-600 break-all">{form.company_logo_url}</p>
              </div>
              <Field label="Logo URL">
                <Input value={form.company_logo_url} onChange={(e) => patch('company_logo_url', e.target.value)} />
              </Field>
              <div>
                <Label className="text-slate-800">Upload logo</Label>
                <Input
                  ref={logoFileRef}
                  type="file"
                  accept="image/*"
                  className="mt-1"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void uploadImage(file, 'brand', (url) => patch('company_logo_url', url))
                  }}
                />
              </div>
              <Field label="SEO page title">
                <Input value={form.seo_title} onChange={(e) => patch('seo_title', e.target.value)} />
              </Field>
              <Field label="SEO description">
                <Textarea rows={3} value={form.seo_description} onChange={(e) => patch('seo_description', e.target.value)} />
              </Field>
              <Field label="SEO keywords" hint="Comma-separated">
                <Input value={form.seo_keywords} onChange={(e) => patch('seo_keywords', e.target.value)} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || uploading} className="bg-[var(--brand-navy)] text-white">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving…' : 'Save all settings'}
        </Button>
      </div>
    </div>
  )
}
