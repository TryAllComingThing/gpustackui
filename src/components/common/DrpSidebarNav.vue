<script setup lang="ts">
import { computed } from 'vue'
import type { NavigationMenuItem } from '@nuxt/ui/runtime/components/NavigationMenu.vue'

const props = withDefaults(defineProps<{
  items: NavigationMenuItem[]
  collapsed?: boolean
}>(), { collapsed: false })

const activeKey = defineModel<string>('activeKey', { default: '' })
const openItems = defineModel<string[]>('openItems', { default: () => [] })
const emit = defineEmits<{ select: [item: NavigationMenuItem] }>()

function decorate(item: NavigationMenuItem): NavigationMenuItem {
  return {
    ...item,
    active: item.value === activeKey.value,
    children: item.children?.map(decorate),
    onSelect: (event: Event) => {
      if (item.value) activeKey.value = item.value
      emit('select', item)
      item.onSelect?.(event)
    },
  }
}

const normalizedItems = computed(() => props.items.map(decorate))

function updateOpenItems(value: string | string[] | undefined) {
  openItems.value = Array.isArray(value) ? value : value ? [value] : []
}
</script>

<template>
  <nav class="drp-sidebar-nav" :data-collapsed="collapsed" aria-label="主导航">
    <UNavigationMenu
      v-model="openItems"
      :items="normalizedItems"
      orientation="vertical"
      type="multiple"
      :collapsed="collapsed"
      :tooltip="collapsed"
      :popover="collapsed"
      highlight
      color="primary"
      class="drp-sidebar-nav__menu"
      @update:model-value="updateOpenItems"
    />
  </nav>
</template>
