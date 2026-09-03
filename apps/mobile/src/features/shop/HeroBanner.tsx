import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import type { PublicCatalogueItem } from '@/src/api/public-types'
import { shopColor, shopRadius, shopSpace } from '@/src/features/shop/shop-theme'
import { font } from '@/src/theme'

const DWELL_MS = 3800
const SLIDE_MS = 560

export function HeroBanner({
  slides,
  title,
  emphasis,
  body,
  shopNow,
  fallbackLabel,
  onOpen,
}: {
  slides: PublicCatalogueItem[]
  title: string
  emphasis: string
  body: string
  shopNow: string
  fallbackLabel: string
  onOpen: (product: PublicCatalogueItem | null) => void
}) {
  const [index, setIndex] = useState(0)
  const [failed, setFailed] = useState<Record<string, boolean>>({})
  const [stageWidth, setStageWidth] = useState(0)
  const shift = useRef(new Animated.Value(0)).current
  const indexRef = useRef(0)
  const busy = useRef(false)
  const slideKey = useMemo(() => slides.map((item) => item.slug).join('|'), [slides])

  indexRef.current = index
  const current = slides[index] ?? null
  const next = slides.length > 1 ? slides[(index + 1) % slides.length] : null
  const currentImage = current?.image && !failed[current.slug] ? current.image : null
  const nextImage = next?.image && !failed[next.slug] ? next.image : null

  useEffect(() => {
    indexRef.current = 0
    setIndex(0)
    shift.setValue(0)
    busy.current = false
  }, [slideKey, shift])

  useEffect(() => {
    if (slides.length < 2 || stageWidth <= 0) return
    const tick = () => {
      if (busy.current) return
      busy.current = true
      Animated.timing(shift, {
        toValue: 1,
        duration: SLIDE_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          const nextIndex = (indexRef.current + 1) % slides.length
          indexRef.current = nextIndex
          setIndex(nextIndex)
          shift.setValue(0)
        }
        busy.current = false
      })
    }
    const id = setInterval(tick, DWELL_MS)
    return () => {
      clearInterval(id)
      shift.stopAnimation()
      busy.current = false
    }
  }, [slides.length, stageWidth, shift, slideKey])

  const translateX =
    stageWidth > 0
      ? shift.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -stageWidth],
        })
      : 0

  return (
    <Pressable
      onPress={() => onOpen(current)}
      accessibilityRole="button"
      accessibilityLabel={current ? current.name : fallbackLabel}
      style={({ pressed }) => [styles.hero, pressed && styles.pressed]}
    >
      <View
        style={styles.heroStage}
        onLayout={(event) => {
          const nextWidth = Math.round(event.nativeEvent.layout.width)
          if (nextWidth > 0 && nextWidth !== stageWidth) setStageWidth(nextWidth)
        }}
      >
        {currentImage && nextImage && stageWidth > 0 ? (
          <Animated.View
            style={[styles.heroTrack, { width: stageWidth * 2, transform: [{ translateX }] }]}
          >
            <Image
              source={{ uri: currentImage }}
              style={[styles.heroSlide, { width: stageWidth }]}
              contentFit="contain"
              contentPosition="right"
              onError={() => current && setFailed((prev) => ({ ...prev, [current.slug]: true }))}
            />
            <Image
              source={{ uri: nextImage }}
              style={[styles.heroSlide, { width: stageWidth }]}
              contentFit="contain"
              contentPosition="right"
              onError={() => next && setFailed((prev) => ({ ...prev, [next.slug]: true }))}
            />
          </Animated.View>
        ) : currentImage ? (
          <Image
            source={{ uri: currentImage }}
            style={styles.heroSlideFill}
            contentFit="contain"
            contentPosition="right"
            onError={() => current && setFailed((prev) => ({ ...prev, [current.slug]: true }))}
          />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons name="cube-outline" size={48} color="#6B7280" />
          </View>
        )}
      </View>
      <Image
        pointerEvents="none"
        source={require('../../../assets/hero-fade.png')}
        style={styles.heroBlend}
        contentFit="fill"
      />
      <View style={styles.heroCopy}>
        <Text
          style={styles.heroTitle}
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1}
        >
          {title}
        </Text>
        <Text style={styles.heroEm} maxFontSizeMultiplier={1.15}>
          {emphasis}
        </Text>
        <Text style={styles.heroBody} maxFontSizeMultiplier={1.15}>
          {body}
        </Text>
        <View style={styles.heroBtn}>
          <Text style={styles.heroBtnLabel}>{shopNow}</Text>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  hero: {
    height: 216,
    borderRadius: shopRadius.lg,
    backgroundColor: shopColor.hero,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  heroStage: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '78%',
    overflow: 'hidden',
  },
  heroTrack: {
    height: '100%',
    flexDirection: 'row',
  },
  heroSlide: {
    height: '100%',
  },
  heroSlideFill: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBlend: {
    ...StyleSheet.absoluteFillObject,
  },
  heroCopy: {
    alignSelf: 'flex-start',
    width: '56%',
    paddingVertical: shopSpace.lg,
    paddingLeft: shopSpace.lg,
    paddingRight: 8,
    gap: 6,
    zIndex: 1,
  },
  heroTitle: {
    fontFamily: font.bold,
    fontSize: 20,
    lineHeight: 24,
    color: shopColor.white,
  },
  heroEm: {
    fontFamily: font.bold,
    fontSize: 22,
    lineHeight: 26,
    color: shopColor.green,
  },
  heroBody: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 18,
    color: '#D1D5DB',
    marginTop: 2,
  },
  heroBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: shopColor.green,
    borderRadius: shopRadius.pill,
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: 'center',
  },
  heroBtnLabel: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: shopColor.white,
  },
  pressed: { opacity: 0.88 },
})
