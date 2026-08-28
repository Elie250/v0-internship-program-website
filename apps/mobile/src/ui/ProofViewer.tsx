import { useState } from 'react'
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
import { colors, space } from '@/src/theme'

export function ProofViewer({ url }: { url: string | null | undefined }) {
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (!url) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No payment proof attached</Text>
      </View>
    )
  }

  if (failed) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Payment proof could not be loaded</Text>
      </View>
    )
  }

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.thumbWrap}>
        {!loaded ? <ActivityIndicator color={colors.navy} style={styles.loader} /> : null}
        <Image
          source={{ uri: url }}
          style={styles.thumb}
          contentFit="contain"
          cachePolicy="memory"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
        <Text style={styles.hint}>Tap to enlarge</Text>
      </Pressable>
      <Modal visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <Pressable onPress={() => setOpen(false)} style={styles.close}>
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
  hint: { textAlign: 'center', padding: 8, color: colors.muted, fontSize: 12 },
  empty: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
    backgroundColor: colors.bg,
  },
  emptyText: { color: colors.muted, textAlign: 'center' },
  modal: { flex: 1, backgroundColor: '#0f172a' },
  close: { padding: space.md, alignItems: 'flex-end' },
  closeText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  zoomBox: { flexGrow: 1, justifyContent: 'center' },
  full: { width: '100%', height: 520 },
})
