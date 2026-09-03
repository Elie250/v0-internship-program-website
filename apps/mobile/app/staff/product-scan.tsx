import { useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useProductDraft } from '@/src/features/products/product-draft-store'
import {
  CAMERA_PERMISSION_BLOCKED,
  CAMERA_PERMISSION_PROMPT,
  cameraPermissionPhase,
  shouldRequestCameraPermission,
} from '@/src/features/pos/barcode-permission'
import { PrimaryButton } from '@/src/ui/Button'
import { BackLink } from '@/src/ui/BackLink'
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

export default function ProductScanScreen() {
  return (
    <RequireStaffNav navKey="products">
      <ProductScanBody />
    </RequireStaffNav>
  )
}

function ProductScanBody() {
  const insets = useSafeAreaInsets()
  const [permission, requestPermission] = useCameraPermissions()
  const setPendingBarcode = useProductDraft((s) => s.setPendingBarcode)
  const processingRef = useRef(false)
  const [status, setStatus] = useState<string | null>(null)
  const phase = cameraPermissionPhase(permission)

  async function handleBarcode(result: BarcodeScanningResult) {
    if (processingRef.current) return
    const code = String(result.data ?? '').replace(/[\s-]/g, '').trim()
    if (!code) return
    processingRef.current = true
    setStatus(code)
    setPendingBarcode(code)
    if (router.canGoBack()) router.back()
    else router.replace('/staff/products')
  }

  return (
    <View style={[styles.wrap, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <BackLink label="Products" onPress={() => router.back()} />
      <Text style={type.screenTitle}>Scan product barcode</Text>
      {phase === 'loading' ? <ActivityIndicator color={colors.primary} /> : null}
      {phase === 'prompt' ? (
        <PrimaryButton
          label="Allow camera"
          onPress={() => {
            if (shouldRequestCameraPermission(permission)) void requestPermission()
          }}
        />
      ) : null}
      {phase === 'blocked' ? <Text style={type.helper}>{CAMERA_PERMISSION_BLOCKED}</Text> : null}
      {phase === 'ready' ? (
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: [...RETAIL_BARCODE_TYPES] }}
          onBarcodeScanned={handleBarcode}
        />
      ) : null}
      {phase === 'prompt' ? <Text style={type.helper}>{CAMERA_PERMISSION_PROMPT}</Text> : null}
      {status ? <Text style={type.helper}>{status}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background, paddingHorizontal: space.lg, gap: space.md },
  camera: { flex: 1, minHeight: 280, borderRadius: 12, overflow: 'hidden' },
})
