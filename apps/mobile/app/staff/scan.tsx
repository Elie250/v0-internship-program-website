import { useRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { lookupProductByBarcode } from '@/src/features/pos/barcode-lookup'
import {
  CAMERA_PERMISSION_BLOCKED,
  CAMERA_PERMISSION_PROMPT,
  SCAN_BARCODE_TITLE,
  cameraPermissionPhase,
  shouldRequestCameraPermission,
} from '@/src/features/pos/barcode-permission'
import { usePosCart } from '@/src/features/pos/cart-store'
import { ProductRow } from '@/src/features/pos/ProductRow'
import type { StaffProduct } from '@/src/api/types'
import { PrimaryButton } from '@/src/ui/Button'
import { RequireStaffNav } from '@/src/ui/RequireStaffNav'
import { colors, space, type } from '@/src/theme'

const RETAIL_BARCODE_TYPES = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'code93',
  'itf14',
  'codabar',
  'qr',
] as const

function returnToPos() {
  if (router.canGoBack()) router.back()
  else router.replace('/staff/pos')
}

export default function ScanScreen() {
  return (
    <RequireStaffNav navKey="pos">
      <ScanBody />
    </RequireStaffNav>
  )
}

function ScanBody() {
  const insets = useSafeAreaInsets()
  const [permission, requestPermission] = useCameraPermissions()
  const addProduct = usePosCart((s) => s.addProduct)
  const processingRef = useRef(false)
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [found, setFound] = useState<StaffProduct | null>(null)
  const phase = cameraPermissionPhase(permission)

  async function handleBarcode(result: BarcodeScanningResult) {
    if (processingRef.current) return
    processingRef.current = true
    setProcessing(true)
    setFound(null)
    setStatus(null)
    let stayOnScanner = true
    try {
      const lookup = await lookupProductByBarcode(result.data)
      if (lookup.kind === 'found') {
        setStatus(lookup.product.name)
        if (lookup.canSell) {
          addProduct(lookup.product)
          stayOnScanner = false
          returnToPos()
          return
        }
        setFound(lookup.product)
        return
      }
      setStatus(lookup.message)
    } finally {
      if (stayOnScanner) {
        processingRef.current = false
        setProcessing(false)
      }
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.top}>
        <Pressable
          onPress={returnToPos}
          accessibilityRole="button"
          accessibilityLabel="Return to POS"
          style={styles.back}
        >
          <Text style={styles.backLabel}>← POS</Text>
        </Pressable>
        <Text style={type.screenTitle}>{SCAN_BARCODE_TITLE}</Text>
      </View>

      {phase === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.navy} size="large" />
        </View>
      ) : null}

      {phase === 'prompt' ? (
        <View style={styles.center}>
          <Text style={styles.prompt}>{CAMERA_PERMISSION_PROMPT}</Text>
          <PrimaryButton
            label="Allow camera"
            onPress={() => {
              if (!shouldRequestCameraPermission(permission)) return
              void requestPermission()
            }}
          />
          <PrimaryButton label="Return to POS" tone="outline" onPress={returnToPos} />
        </View>
      ) : null}

      {phase === 'blocked' ? (
        <View style={styles.center}>
          <Text style={styles.prompt}>{CAMERA_PERMISSION_BLOCKED}</Text>
          <PrimaryButton label="Return to POS" onPress={returnToPos} />
        </View>
      ) : null}

      {phase === 'ready' ? (
        <View style={styles.cameraWrap}>
          <CameraView
            facing="back"
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: [...RETAIL_BARCODE_TYPES] }}
            onBarcodeScanned={processing ? undefined : handleBarcode}
          />
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.frame} />
            <Text style={styles.scanHint}>{SCAN_BARCODE_TITLE}</Text>
          </View>
          {processing ? (
            <View style={styles.busy} pointerEvents="none">
              <ActivityIndicator color={colors.white} />
            </View>
          ) : null}
        </View>
      ) : null}

      {status ? <Text style={styles.status}>{status}</Text> : null}

      {found ? (
        <View style={styles.result}>
          <ProductRow product={found} onAdd={() => undefined} />
          <Text style={type.meta}>Out of stock. Scan another barcode, or return to POS.</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: {
    paddingHorizontal: space.md,
    paddingBottom: 8,
    gap: 2,
  },
  back: { minHeight: 44, justifyContent: 'center' },
  backLabel: { ...type.heading, color: colors.navy },
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  prompt: { ...type.productName, textAlign: 'center' },
  cameraWrap: { flex: 1, marginHorizontal: space.md, borderRadius: 16, overflow: 'hidden' },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 240,
    height: 140,
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scanHint: {
    marginTop: space.md,
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  busy: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    ...type.productName,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  result: { backgroundColor: colors.card },
})
