import { Pressable, StyleSheet, View } from 'react-native'
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs'
export function makeShopTabButton(label: string) {
  return function ShopTabButton(props: BottomTabBarButtonProps) {
    const selected = Boolean(props['aria-selected'] ?? props.accessibilityState?.selected)
    return (
      <Pressable
        testID={props.testID}
        collapsable={false}
        onPress={props.onPress ?? undefined}
        onLongPress={props.onLongPress ?? undefined}
        accessible
        accessibilityRole="tab"
        accessibilityLabel={selected ? `${label}, selected` : label}
        accessibilityState={{ selected }}
        android_ripple={props.android_ripple}
        style={[styles.hit, props.style]}
      >
        <View
          collapsable={false}
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          style={styles.inner}
        >
          {props.children}
        </View>
      </Pressable>
    )
  }
}

const styles = StyleSheet.create({
  hit: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    alignSelf: 'stretch',
  },
})
