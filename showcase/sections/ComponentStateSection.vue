<script setup lang="ts">
import { ref } from 'vue'
import DrpDrawer from '../../src/components/common/DrpDrawer.vue'
import DrpModal from '../../src/components/common/DrpModal.vue'

const dialogOpen = ref(false)
const drawerOpen = ref(false)
const toastOpen = ref(false)
const tab = ref('default')
const tabs = [
  { label: '默认', value: 'default', content: '默认状态使用统一 --gp-* Token。' },
  { label: '错误', value: 'error', content: '错误状态使用 UAlert，并保留可读文本。' },
]
</script>

<template>
  <section class="gp-card demo-section f4-state-section" data-testid="section-f4-states" aria-labelledby="f4-state-heading">
    <div class="drp-section-heading">
      <div>
        <h2 id="f4-state-heading">F4 状态适配 / Nuxt UI 4</h2>
        <p>直接复用 Nuxt UI 原语，接入现有主题 Token 和 Density。</p>
      </div>
    </div>
    <div class="f4-state-grid">
      <UCard data-testid="state-card" class="f4-state-card">
        <template #header><strong>Card / Badge</strong></template>
        <div class="demo-row f4-state-row">
          <UBadge data-testid="state-badge-success" color="success">成功</UBadge>
          <UBadge data-testid="state-badge-warning" color="warning">警告</UBadge>
          <UBadge data-testid="state-badge-error" color="error">错误</UBadge>
        </div>
      </UCard>

      <UCard data-testid="state-feedback" class="f4-state-card">
        <template #header><strong>Empty / Loading / Error</strong></template>
        <div class="f4-state-stack">
          <UEmpty icon="i-lucide-inbox" title="暂无数据" description="当前筛选条件没有结果。" data-testid="state-empty" />
          <USkeleton class="f4-skeleton" data-testid="state-loading" />
          <UAlert color="error" variant="subtle" title="加载失败" description="请稍后重试。" data-testid="state-error" />
        </div>
      </UCard>

      <UCard data-testid="state-tabs" class="f4-state-card">
        <template #header><strong>Tabs / Dialog / Toast</strong></template>
        <UTabs v-model="tab" :items="tabs" color="primary" variant="link" />
        <div class="demo-row f4-state-row">
        <DrpModal v-model:open="dialogOpen" title="确认操作" description="Dialog 使用 Nuxt UI focus trap 和 Escape 行为。" data-testid="state-dialog">
          <UButton data-testid="state-dialog-open">打开 Dialog</UButton>
          <template #body><p>这是 F4 Dialog 状态验证。</p></template>
        </DrpModal>
          <UButton data-testid="state-drawer-open" color="neutral" variant="outline" @click="drawerOpen = true">打开 Drawer</UButton>
          <UButton data-testid="state-toast-open" color="neutral" variant="outline" @click="toastOpen = true">显示 Toast</UButton>
        </div>

        <DrpDrawer v-model:open="drawerOpen" title="筛选条件" description="Drawer 使用 Nuxt UI 的移动端焦点和 Escape 行为。" data-testid="state-drawer">
          <template #body><p>这是 F4 Drawer 状态验证。</p></template>
        </DrpDrawer>
        <UToast v-model:open="toastOpen" title="操作成功" description="Toast 使用 Nuxt UI live region。" color="success" :duration="0" data-testid="state-toast" />
      </UCard>
    </div>
  </section>
</template>
