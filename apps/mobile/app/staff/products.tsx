import { useEffect, useState } from 'react'
import { Image } from 'expo-image'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useBackToMore } from '@/src/navigation/use-back-to-more'
import { useProductLookup } from '@/src/features/pos/hooks'
import { useProductDraft } from '@/src/features/products/product-draft-store'
import { useSessionStore } from '@/src/auth/session-store'
import {
  canManageProducts,
  canViewProductCost,
  canEditSellingPrice,
  canReceiveStock,
} from '@/src/permissions'
import { SELLING_UNITS } from '@/src/features/products/selling-units'
import {
  createStaffProduct,
  fetchShopCategories,
  updateStaffProduct,
  uploadStaffProductImage,
} from '@/src/api/staff'
import type { ShopCategory, StaffProduct } from '@/src/api/types'
import { Input } from '@/src/ui/Input'
import { PrimaryButton } from '@/src/ui/Button'
import { formatRwf } from '@/src/format'
import { ProductSearchField } from '@/src/ui/SearchField'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { RequireStaffNav } from '@/src/ui/RequireStaffNav'
import { colors, font, radius, space, type } from '@/src/theme'

function firstImage(images: unknown): string {
  if (Array.isArray(images) && typeof images[0] === 'string') return images[0]
  return ''
}

export default function ProductsScreen() {
  return (
    <RequireStaffNav navKey="products">
      <ProductsBody />
    </RequireStaffNav>
  )
}

function emptyForm() {
  return {
    name: '',
    description: '',
    sku: '',
    barcode: '',
    categoryId: '',
    price: '',
    cost: '',
    imageUrl: '',
    status: 'published',
    sellingQuantity: '1',
    sellingUnit: 'PCS',
    featured: false,
    lowStock: '5',
    target: '',
  }
}

function ProductsBody() {
  useBackToMore()
  const router = useRouter()
  const [q, setQ] = useState('')
  const [submitted, setSubmitted] = useState('')
  const user = useSessionStore((s) => s.user)
  const showCost = canViewProductCost(user?.permissions)
  const canManage = canManageProducts(user?.permissions)
  const canPrice = canEditSellingPrice(user?.permissions)
  const canReceive = canReceiveStock(user?.permissions)
  const [created, setCreated] = useState<{ id: string; name: string } | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [categories, setCategories] = useState<ShopCategory[]>([])
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const pendingBarcode = useProductDraft((s) => s.pendingBarcode)
  const pendingPhotoUri = useProductDraft((s) => s.pendingPhotoUri)
  const consumeBarcode = useProductDraft((s) => s.consumeBarcode)
  const consumePhotoUri = useProductDraft((s) => s.consumePhotoUri)
  const query = useProductLookup(
    { q: submitted || undefined, status: canManage ? 'all' : undefined },
    true
  )

  useEffect(() => {
    void fetchShopCategories()
      .then((rows) => setCategories(Array.isArray(rows) ? rows : []))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!pendingBarcode) return
    const code = consumeBarcode()
    if (code) {
      setForm((current) => ({ ...current, barcode: code }))
      setEditorOpen(true)
    }
  }, [pendingBarcode, consumeBarcode])

  useEffect(() => {
    if (!pendingPhotoUri) return
    const uri = consumePhotoUri()
    if (!uri) return
    setUploading(true)
    setMessage('')
    void uploadStaffProductImage(uri)
      .then((result) => {
        setForm((current) => ({ ...current, imageUrl: result.url }))
        setEditorOpen(true)
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : 'Photo upload failed')
      })
      .finally(() => setUploading(false))
  }, [pendingPhotoUri, consumePhotoUri])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setEditorOpen(true)
    setMessage('')
  }

  function openEdit(product: StaffProduct) {
    setEditingId(product.id)
    setForm({
      name: product.name,
      description: product.description ?? '',
      sku: product.sku ?? '',
      barcode: product.barcode ?? '',
      categoryId: product.categoryId ?? product.category?.id ?? '',
      price: product.price != null ? String(product.price) : '',
      cost: product.costPrice != null ? String(product.costPrice) : '',
      imageUrl: firstImage(product.images),
      status:
        product.status === 'draft' || product.status === 'archived'
          ? product.status
          : 'published',
      sellingQuantity: String(product.sellingQuantity ?? 1),
      sellingUnit: product.sellingUnit || 'PCS',
      featured: Boolean(product.isFeatured),
      lowStock: product.lowStockThreshold != null ? String(product.lowStockThreshold) : '5',
      target: product.targetStock != null ? String(product.targetStock) : '',
    })
    setEditorOpen(true)
    setMessage('')
  }

  async function save() {
    setBusy(true)
    setMessage('')
    try {
      const payload = {
        name: form.name,
        description: form.description,
        sku: form.sku,
        barcode: form.barcode,
        categoryId: form.categoryId || null,
        price: form.price ? Number(form.price) : undefined,
        costPrice: form.cost ? Number(form.cost) : undefined,
        images: form.imageUrl ? [form.imageUrl] : [],
        status: form.status === 'archived' ? undefined : form.status === 'draft' ? 'draft' : 'published',
        sellingQuantity: Number(form.sellingQuantity) || 1,
        sellingUnit: form.sellingUnit,
        isFeatured: form.featured,
        lowStockThreshold: form.lowStock ? Number(form.lowStock) : 5,
        targetStock: form.target ? Number(form.target) : null,
      }
      if (editingId) {
        await updateStaffProduct(editingId, payload)
        setMessage('Product updated.')
      } else {
        const createdItem = await createStaffProduct(payload)
        setCreated({ id: createdItem.item.id, name: createdItem.item.name })
        setMessage('')
      }
      setEditorOpen(false)
      setEditingId(null)
      setForm(emptyForm())
      void query.refetch()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Text style={type.kicker}>Energy & Logics</Text>
      <Text style={type.screenTitle}>Products</Text>
      <ProductSearchField
        value={q}
        onChange={setQ}
        onSubmit={() => setSubmitted(q.trim())}
      />
      {canManage ? (
        <PrimaryButton
          label={editorOpen ? 'Close editor' : 'New product'}
          onPress={() => (editorOpen ? setEditorOpen(false) : openCreate())}
        />
      ) : null}
      {canManage && editorOpen ? (
        <View style={styles.create}>
          <Text style={type.bodyMedium}>{editingId ? 'Edit product' : 'Create product'}</Text>
          <Input label="Name" value={form.name} onChangeText={(name) => setForm((c) => ({ ...c, name }))} />
          <Text style={styles.label}>Category</Text>
          <View style={styles.chips}>
            {categories.map((category) => {
              const on = form.categoryId === category.id
              return (
                <Pressable
                  key={category.id}
                  onPress={() =>
                    setForm((c) => ({ ...c, categoryId: on ? '' : category.id }))
                  }
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipLabel, on && styles.chipLabelOn]}>{category.name}</Text>
                </Pressable>
              )
            })}
          </View>
          <Input label="SKU" value={form.sku} onChangeText={(sku) => setForm((c) => ({ ...c, sku }))} />
          <Input
            label="Barcode"
            value={form.barcode}
            onChangeText={(barcode) => setForm((c) => ({ ...c, barcode }))}
            autoCapitalize="characters"
          />
          <PrimaryButton label="Scan barcode" onPress={() => router.push('/staff/product-scan' as never)} />
          {canPrice ? (
            <Input
              label="Selling price (RWF)"
              value={form.price}
              onChangeText={(price) => setForm((c) => ({ ...c, price }))}
              keyboardType="number-pad"
            />
          ) : null}
          {showCost ? (
            <Input
              label="Cost (RWF)"
              value={form.cost}
              onChangeText={(cost) => setForm((c) => ({ ...c, cost }))}
              keyboardType="number-pad"
            />
          ) : null}
          <Input
            label="Description"
            value={form.description}
            onChangeText={(description) => setForm((c) => ({ ...c, description }))}
            multiline
            style={styles.multiline}
          />
          <Text style={styles.label}>Status</Text>
          {form.status === 'archived' ? (
            <View style={styles.chips}>
              <Text style={type.helper}>Archived. Restore as published to sell it again.</Text>
              <PrimaryButton
                label="Restore as published"
                variant="secondary"
                onPress={() => setForm((c) => ({ ...c, status: 'published' }))}
              />
            </View>
          ) : (
            <View style={styles.chips}>
              {(['published', 'draft'] as const).map((status) => {
                const on = form.status === status
                return (
                  <Pressable
                    key={status}
                    onPress={() => setForm((c) => ({ ...c, status }))}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipLabel, on && styles.chipLabelOn]}>
                      {status === 'published' ? 'Published' : 'Draft'}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          )}
          <Input
            label="Selling quantity"
            value={form.sellingQuantity}
            onChangeText={(sellingQuantity) => setForm((c) => ({ ...c, sellingQuantity }))}
            keyboardType="decimal-pad"
          />
          <Text style={styles.label}>Selling unit</Text>
          <View style={styles.chips}>
            {SELLING_UNITS.map((unit) => {
              const on = form.sellingUnit === unit
              return (
                <Pressable
                  key={unit}
                  onPress={() => setForm((c) => ({ ...c, sellingUnit: unit }))}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipLabel, on && styles.chipLabelOn]}>{unit}</Text>
                </Pressable>
              )
            })}
          </View>
          <Pressable
            onPress={() => setForm((c) => ({ ...c, featured: !c.featured }))}
            style={[styles.chip, form.featured && styles.chipOn]}
          >
            <Text style={[styles.chipLabel, form.featured && styles.chipLabelOn]}>
              Featured on storefront
            </Text>
          </Pressable>
          <Input
            label="Low-stock threshold"
            value={form.lowStock}
            onChangeText={(lowStock) => setForm((c) => ({ ...c, lowStock }))}
            keyboardType="number-pad"
          />
          <Text style={type.helper}>
            A product is considered low stock when current stock is at or below this value.
          </Text>
          <Input
            label="Target stock"
            value={form.target}
            onChangeText={(target) => setForm((c) => ({ ...c, target }))}
            keyboardType="number-pad"
          />
          <Text style={type.helper}>Used to calculate the suggested replenishment quantity.</Text>
          {form.imageUrl ? (
            <Image source={{ uri: form.imageUrl }} style={styles.preview} contentFit="cover" />
          ) : null}
          <PrimaryButton
            label={uploading ? 'Uploading photo…' : 'Take product photo'}
            disabled={uploading}
            onPress={() => router.push('/staff/product-photo' as never)}
          />
          <Text style={type.helper}>Stock starts at 0. Receive units from Inventory after create.</Text>
          <PrimaryButton
            label={busy ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}
            disabled={busy || uploading}
            onPress={() => void save()}
          />
        </View>
      ) : null}
      {created ? (
        <View style={styles.create}>
          <Text style={type.bodyMedium}>Product created successfully.</Text>
          <Text style={type.helper}>Stock is 0. Receive stock next so the movement is recorded.</Text>
          {canReceive ? (
            <PrimaryButton
              label="Receive stock"
              onPress={() =>
                router.replace(`/staff/inventory?productId=${created.id}` as never)
              }
            />
          ) : null}
          <PrimaryButton
            label="Done"
            variant="secondary"
            onPress={() => setCreated(null)}
          />
        </View>
      ) : null}
      {message ? <Text style={type.helper}>{message}</Text> : null}
      <ScreenState
        loading={query.isLoading}
        error={query.error?.message}
        errorTitle="Couldn't load products"
        empty={(query.data?.items.length ?? 0) === 0}
        emptyTitle="No products found"
        emptyBody="Try another name or SKU."
        onRetry={() => void query.refetch()}
      >
        <View style={styles.list}>
          {(query.data?.items ?? []).map((product, index, all) => (
            <View
              key={product.id}
              style={[styles.row, index < all.length - 1 && styles.rowLine]}
            >
              <Text style={type.productName} numberOfLines={2} maxFontSizeMultiplier={1.3}>
                {product.name}
              </Text>
              <Text style={type.metadata} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                {product.sku || 'No SKU'}
                {product.barcode ? ` · ${product.barcode}` : ''}
                {` · ${product.sellingUnit || product.sellingUnitLabel}`}
              </Text>
              <View style={styles.metaRow}>
                <Text style={type.price} maxFontSizeMultiplier={1.3}>
                  {formatRwf(product.price)}
                </Text>
                <Text
                  style={[type.helper, product.stock <= 0 && styles.out]}
                  maxFontSizeMultiplier={1.3}
                >
                  Stock {product.stock}
                </Text>
              </View>
              {showCost && product.costPrice != null ? (
                <Text style={type.helper}>Cost {formatRwf(product.costPrice)}</Text>
              ) : null}
              {canManage ? (
                <View style={styles.actions}>
                  <Text style={styles.edit} onPress={() => openEdit(product)}>
                    Edit
                  </Text>
                  {product.status !== 'archived' ? (
                    <Text
                      style={styles.archive}
                      onPress={() => {
                        void updateStaffProduct(product.id, { status: 'archived' }).then(() =>
                          query.refetch()
                        )
                      }}
                    >
                      Archive
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </ScreenState>
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: space.md,
    paddingVertical: space.s12,
    minHeight: 72,
    gap: 4,
    justifyContent: 'center',
  },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.sm },
  out: { color: colors.danger },
  create: { gap: space.sm, marginBottom: space.md },
  actions: { flexDirection: 'row', gap: space.md, marginTop: 4 },
  edit: { color: colors.primary, fontFamily: font.semibold, fontSize: 13 },
  archive: { color: colors.danger, fontFamily: font.semibold, fontSize: 13 },
  label: { fontFamily: font.semibold, fontSize: 13, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.primarySubtle, borderColor: colors.primary },
  chipLabel: { fontFamily: font.medium, fontSize: 13, color: colors.text },
  chipLabelOn: { color: colors.primary },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  preview: { width: 96, height: 96, borderRadius: 8, backgroundColor: colors.surface },
})
