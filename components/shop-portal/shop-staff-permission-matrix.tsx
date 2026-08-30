'use client'

import { getPermissionsForRole, type Permission } from '@/lib/admin/permissions'
import {
  SHOP_STAFF_PERMISSION_LABELS,
  SHOP_STAFF_PERMISSION_MATRIX,
} from '@/lib/shop/staff-permission-matrix'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'

export function ShopStaffPermissionMatrix({
  role,
  extras,
  onChange,
  disabled,
}: {
  role: string
  extras: string[]
  onChange: (extras: string[]) => void
  disabled?: boolean
}) {
  const t = useShopT()
  const defaults = new Set(getPermissionsForRole(role))
  const extraSet = new Set(extras)

  function toggle(key: Permission, checked: boolean) {
    if (defaults.has(key)) return
    const next = new Set(extraSet)
    if (checked) next.add(key)
    else next.delete(key)
    onChange([...next])
  }

  return (
    <fieldset className="space-y-3 rounded-lg border border-slate-200 p-3">
      <legend className="px-1 text-sm font-medium text-slate-900">{t('staff.perms.title')}</legend>
      <p className="text-xs text-slate-500">{t('staff.perms.hint')}</p>
      {SHOP_STAFF_PERMISSION_MATRIX.map((group) => (
        <div key={group.id} className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t(group.labelKey)}
          </p>
          <div className="space-y-1">
            {group.keys.map((key) => {
              const fromRole = defaults.has(key)
              const checked = fromRole || extraSet.has(key)
              const labelKey = SHOP_STAFF_PERMISSION_LABELS[key]
              return (
                <label
                  key={key}
                  className="flex min-h-10 items-center gap-2 rounded-md px-1 text-sm text-slate-800"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--brand-navy,#1e3a5f)]"
                    checked={checked}
                    disabled={disabled || fromRole}
                    onChange={(event) => toggle(key, event.target.checked)}
                  />
                  <span>
                    {labelKey ? t(labelKey) : key}
                    {fromRole ? (
                      <span className="ml-1 text-xs text-slate-400">{t('staff.perms.fromRole')}</span>
                    ) : null}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </fieldset>
  )
}
