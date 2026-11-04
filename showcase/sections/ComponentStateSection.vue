<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '@nuxt/ui/composables/useToast'
const dialogOpen = ref(false)
const drawerOpen = ref(false)
const tab = ref('default')
const toast = useToast()
const tabs = [
  { label: '默认', value: 'default' },
  { label: '错误', value: 'error', content: '错误状态使用 UAlert，并保留可读文本。' },
]
function showToast() {
  toast.add({ title: '操作成功', description: 'Toast 使用 Nuxt UI live region。', color: 'success', duration: 5000, close: true })
}
</script>

<template>
  <section class="gp-card demo-section showcase-state-section" data-testid="section-component-states" aria-labelledby="component-state-heading">
    <div class="gp-section-heading">
      <div>
        <h2 id="component-state-heading">组件状态适配 / Nuxt UI 4</h2>
        <p>直接复用 Nuxt UI 原语，接入现有主题 Token 和 Density。</p>
      </div>
    </div>
    <div class="showcase-state-grid">
      <UCard data-testid="state-card" class="showcase-state-card">
        <template #header><strong>Card / Badge</strong></template>
        <div class="demo-row showcase-state-row">
          <UBadge data-testid="state-badge-success" color="success">成功</UBadge>
          <UBadge data-testid="state-badge-warning" color="warning">警告</UBadge>
          <UBadge data-testid="state-badge-error" color="error">错误</UBadge>
        </div>
      </UCard>

      <UCard data-testid="state-feedback" class="showcase-state-card">
        <template #header><strong>Empty / Loading / Error</strong></template>
        <div class="showcase-state-stack">
          <UEmpty icon="i-lucide-inbox" title="暂无数据" description="当前筛选条件没有结果。" data-testid="state-empty" />
          <USkeleton class="showcase-state-skeleton" data-testid="state-loading" />
          <UAlert color="error" variant="subtle" title="加载失败" description="请稍后重试。" data-testid="state-error" />
        </div>
      </UCard>

      <UCard data-testid="state-tabs" class="showcase-state-card">
        <template #header><strong>Tabs / Dialog / Toast</strong></template>
        <UTabs v-model="tab" class="showcase-state-tabs" :items="tabs" color="primary" variant="link" />
        <div class="showcase-state-actions">
          <UModal v-model:open="dialogOpen" title="确认操作" description="Dialog 使用 Nuxt UI focus trap 和 Escape 行为。" data-testid="state-dialog">
            <UButton class="showcase-state-action" data-testid="state-dialog-open">打开 Dialog</UButton>
            <template #body><p>这是 Dialog 状态验证。</p></template>
          </UModal>
          <UButton class="showcase-state-action" data-testid="state-drawer-open" color="neutral" variant="outline" @click="drawerOpen = true">打开 Drawer</UButton>
          <UButton class="showcase-state-action showcase-state-action--wide" data-testid="state-toast-open" color="neutral" variant="outline" @click="showToast">显示 Toast</UButton>
        </div>

        <UDrawer v-model:open="drawerOpen" title="筛选条件" description="Drawer 使用 Nuxt UI 的移动端焦点和 Escape 行为。" close data-testid="state-drawer">
          <template #body><p>这是 Drawer 状态验证。</p></template>
        </UDrawer>
      </UCard>
    </div>
  </section>
</template>
