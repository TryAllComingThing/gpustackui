<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { NavigationMenuItem } from '@nuxt/ui/runtime/components/NavigationMenu.vue'
import DrpSidebarNav from '../common/DrpSidebarNav.vue'

export interface AppSidebarItem { id: string; label: string; to?: string; children?: AppSidebarItem[] }
const props = withDefaults(defineProps<{ items: AppSidebarItem[]; collapsed?: boolean }>(), { collapsed: false })
const route = useRoute()
const activeKey = ref('')
const openItems = ref<string[]>([])
function toNavigationItem(item: AppSidebarItem): NavigationMenuItem {
  return {
    value: item.id,
    label: item.label,
    to: item.to,
    type: item.children?.length ? 'trigger' : 'link',
    children: item.children?.map(toNavigationItem),
  }
}

const navigationItems = computed(() => props.items.map(toNavigationItem))
function syncRoute() {
  const visit = (items: AppSidebarItem[], parents: string[] = []): boolean => {
    for (const item of items) {
      if (item.to && (route.path === item.to || route.path.startsWith(item.to + '/'))) {
        activeKey.value = item.id
        openItems.value = parents
        return true
      }
      if (item.children && visit(item.children, [...parents, item.id])) return true
    }
    return false
  }
  visit(props.items)
}
watch(() => route.path, syncRoute, { immediate: true })
</script>

<template>
  <DrpSidebarNav v-model:active-key="activeKey" v-model:open-items="openItems" :items="navigationItems" :collapsed="collapsed" />
</template>
