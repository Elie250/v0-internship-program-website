import { useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
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

export default function ProductPhotoScreen() {
  return (
    <RequireStaffNav navKey="products">
      <ProductPhotoBody />
    </RequireStaffNav>
  )
}

function ProductPhotoBody() {
  const insets = useSafeAreaInsets()
  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const setPendingPhotoUri = useProductDraft((s) => s.setPendingPhotoUri)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const phase = cameraPermissionPhase(permission)

  return (
    <View style={[styles.wrap, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <BackLink label="Products" onPress={() => router.back()} />
      <Text style={type.screenTitle}>Product photo</Text>
      {phase === 'loading' ? <ActivityIndicator color={colors.primary} /> : null}
      {phase === 'prompt' ? (
        <>
          <Text style={type.helper}>{CAMERA_PERMISSION_PROMPT}</Text>
          <PrimaryButton
            label="Allow camera"
            onPress={() => {
              if (shouldRequestCameraPermission(permission)) void requestPermission()
            }}
          />
        </>
      ) : null}
      {phase === 'blocked' ? <Text style={type.helper}>{CAMERA_PERMISSION_BLOCKED}</Text> : null}
      {phase === 'ready' ? (
        <>
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
          <PrimaryButton
            label={busy ? 'Saving…' : 'Take photo'}
            disabled={busy}
            onPress={async () => {
              setBusy(true)
              setError('')
              try {
                const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 })
                if (!photo?.uri) {
                  setError('Could not take photo.')
                  return
                }
                setPendingPhotoUri(photo.uri)
                if (router.canGoBack()) router.back()
                else router.replace('/staff/products')
              } catch {
                setError('Could not take photo.')
              } finally {
                setBusy(false)
              }
            }}
          />
        </>
      ) : null}
      {error ? <Text style={type.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background, paddingHorizontal: space.lg, gap: space.md },
  camera: { flex: 1, minHeight: 280, borderRadius: 12, overflow: 'hidden' },
})
