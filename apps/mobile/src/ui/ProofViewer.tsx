import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, hitSlop, space } from '@/src/theme'

export function ProofViewer({
  url,
  startOpen = false,
  onClose,
}: {
  url: string | null | undefined
  startOpen?: boolean
  onClose?: () => void
}) {
  const insets = useSafeAreaInsets()
  const [open, setOpen] = useState(startOpen)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (startOpen && url) setOpen(true)
  }, [startOpen, url])

  function close() {
    setOpen(false)
    onClose?.()
  }

  if (!url) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No payment proof attached</Text>
      </View>
    )
  }

  if (failed && !open) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Payment proof could not be loaded</Text>
      </View>
    )
  }

  return (
    <>
      {!startOpen ? (
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="View payment proof"
          style={styles.thumbWrap}
        >
          {!loaded ? <ActivityIndicator color={colors.navy} style={styles.loader} /> : null}
          <Image
            source={{ uri: url }}
            style={styles.thumb}
            contentFit="contain"
            cachePolicy="memory"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
          <Text style={styles.hint}>View payment proof</Text>
        </Pressable>
      ) : null}
      <Modal visible={open} animationType="fade" onRequestClose={close}>
        <View style={[styles.modal, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close payment proof"
            style={styles.close}
          >
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
          <ScrollView
            maximumZoomScale={4}
            minimumZoomScale={1}
            contentContainerStyle={styles.zoomBox}
            centerContent
          >
            <Image source={{ uri: url }} style={styles.full} contentFit="contain" cachePolicy="memory" />
          </ScrollView>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  thumbWrap: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    minHeight: 180,
  },
  thumb: { width: '100%', height: 200, backgroundColor: colors.white },
  loader: { position: 'absolute', top: 80, alignSelf: 'center', zIndex: 1 },
  hint: { textAlign: 'center', padding: 8, color: colors.navy, fontSize: 14, fontWeight: '700' },
  empty: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
    backgroundColor: colors.bg,
  },
  emptyText: { color: colors.muted, textAlign: 'center' },
  modal: { flex: 1, backgroundColor: '#0f172a' },
  close: {
    minHeight: hitSlop,
    paddingHorizontal: space.md,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  closeText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  zoomBox: { flexGrow: 1, justifyContent: 'center' },
  full: { width: '100%', height: 520 },
})
