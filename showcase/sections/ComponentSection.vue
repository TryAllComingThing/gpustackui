<script setup lang="ts">
import { ref } from 'vue'
import type { TreeItem } from '@nuxt/ui/runtime/components/Tree.vue'
import { sampleRows } from '../fixtures/sample'
const name = ref('')
const notes = ref('')
const modalOpen = ref(false)
const count = ref(0)
const fixtureSelected = ref(false)
const protocol = ref('https')
const telemetryEnabled = ref(true)
const uploadFile = ref<File | null>(null)
const uploadError = ref('')
const chartState = ref<'default' | 'empty' | 'error'>('default')
const selectedTreeItem = ref<TreeItem>()
const protocolItems = [
  { label: 'HTTPS', value: 'https' },
  { label: 'HTTP', value: 'http', disabled: true },
]
const treeItems: TreeItem[] = [
  {
    label: 'GPU 资源池',
    defaultExpanded: true,
    children: [
      { label: 'A100 节点', icon: 'i-lucide-cpu' },
      { label: 'H800 节点', icon: 'i-lucide-cpu' },
      { label: '维护中节点', icon: 'i-lucide-wrench', disabled: true },
    ],
  },
  { label: '模型服务', icon: 'i-lucide-boxes', children: [{ label: '推理网关' }] },
]
const chartData = [
  { resource: 'A100', utilization: 68 },
  { resource: 'H800', utilization: 52 },
  { resource: 'L40S', utilization: 44 },
  { resource: 'RTX', utilization: 30 },
]
const chartStates = [
  { label: '有数据', value: 'default' },
  { label: '空状态', value: 'empty' },
  { label: '错误状态', value: 'error' },
]
function onUploadReject(files: File[]) {
  uploadError.value = `${files[0]?.name ?? '所选文件'} 不符合 JSON / CSV 格式`
}
</script>
<template>
  <section class="gp-card demo-section" data-testid="section-components" aria-labelledby="component-heading">
    <h2 id="component-heading">组件状态 / Nuxt UI</h2>
    <div class="demo-row">
      <UButton class="gp-app-button gp-app-button--primary" data-testid="button-primary" @click="count++">主按钮 · {{ count }}</UButton>
      <UButton class="gp-app-button" data-testid="button-disabled" disabled>禁用按钮</UButton>
      <UButton class="gp-app-button" data-testid="button-loading" loading>加载中</UButton>
      <UButton class="gp-app-button gp-app-button--outline" data-testid="button-modal-open" variant="outline" @click="modalOpen = true">打开弹窗</UButton>
    </div>
    <div class="demo-row"><label for="demo-name">模型名称</label><UInput id="demo-name" class="gp-app-input" v-model="name" placeholder="请输入模型名称" /><span>输入值：{{ name || '（空）' }}</span></div>
    <div class="demo-row"><label for="demo-notes">备注</label><UTextarea id="demo-notes" class="gp-app-textarea" v-model="notes" :rows="2" placeholder="请输入备注" /><span>输入值：{{ notes || '（空）' }}</span></div>
    <div class="demo-row" data-testid="date-state-fixtures"><span>部署日期</span><UInputDate aria-label="部署日期" /><UInputDate aria-label="禁用日期" disabled /></div>
    <div class="demo-row" data-testid="input-state-fixtures">
      <UInput model-value="Read-only fixture" readonly aria-label="Read-only fixture" data-testid="input-readonly" />
      <UInput model-value="Disabled fixture" disabled aria-label="Disabled fixture" data-testid="input-disabled" />
      <USelect :items="['One', 'Two']" model-value="One" disabled aria-label="Disabled select fixture" />
      <UCheckbox v-model="fixtureSelected" label="Fixture selection" />
      <UCheckbox disabled label="Disabled selection fixture" />
    </div>
    <h3>扩展组件 / Nuxt UI</h3>
    <div class="advanced-component-grid" data-testid="advanced-components">
      <UCard class="advanced-component-panel" data-testid="advanced-radio-card">
        <template #header><strong>Radio / Switch</strong></template>
        <URadioGroup v-model="protocol" :items="protocolItems" legend="访问协议" orientation="horizontal" data-testid="advanced-radio" />
        <div class="advanced-switch-stack">
          <USwitch v-model="telemetryEnabled" label="启用遥测" description="本地演示，不会发送数据。" data-testid="advanced-switch" />
          <USwitch :model-value="false" disabled label="禁用开关" />
          <USwitch :model-value="true" loading label="正在应用" />
        </div>
      </UCard>

      <UCard class="advanced-component-panel" data-testid="advanced-popover-card">
        <template #header><strong>Popover</strong></template>
        <p class="advanced-component-copy">浮层内容使用真实焦点管理和 Escape 关闭行为。</p>
        <UPopover :content="{ side: 'bottom', align: 'start' }">
          <UButton color="neutral" variant="outline" icon="i-lucide-sliders-horizontal" data-testid="advanced-popover-trigger">筛选条件</UButton>
          <template #content="{ close }">
            <div class="advanced-popover-panel">
              <strong>资源筛选</strong>
              <span>区域：华东</span>
              <span>状态：运行中</span>
              <UButton size="xs" @click="close">应用筛选</UButton>
            </div>
          </template>
        </UPopover>
      </UCard>

      <UCard class="advanced-component-panel" data-testid="advanced-upload-card">
        <template #header><strong>File Upload</strong></template>
        <UFileUpload v-model="uploadFile" accept=".json,.csv" label="上传资源清单" description="仅本地预览，不会上传到后端。" data-testid="advanced-upload" @reject="onUploadReject" />
        <UFileUpload :model-value="null" disabled label="上传队列已锁定" description="禁用状态示例。" />
        <UAlert v-if="uploadError" color="error" variant="subtle" :title="uploadError" class="advanced-upload-error" />
      </UCard>

      <UCard class="advanced-component-panel" data-testid="advanced-tree-card">
        <template #header><strong>Tree</strong></template>
        <UTree v-model="selectedTreeItem" :items="treeItems" color="primary" aria-label="资源树" data-testid="advanced-tree" />
        <p class="advanced-component-copy" role="status">当前选择：{{ selectedTreeItem?.label ?? '未选择' }}</p>
      </UCard>

      <UCard class="advanced-component-panel advanced-component-panel--wide" data-testid="advanced-chart-card">
        <template #header>
          <div class="advanced-component-header"><strong>Chart</strong><USelect v-model="chartState" :items="chartStates" size="sm" aria-label="图表状态" /></div>
        </template>
        <UChart
          v-if="chartState === 'default'"
          type="bar"
          :data="chartData"
          index="resource"
          :categories="[{ key: 'utilization', label: '利用率' }]"
          :colors="['var(--gp-chart-1)']"
          :height="220"
          :format="(value: number) => `${value}%`"
          aria-label="GPU 资源利用率"
          aria-description="A100 68%，H800 52%，L40S 44%，RTX 30%。"
          data-testid="advanced-chart"
        />
        <UEmpty v-else-if="chartState === 'empty'" icon="i-lucide-chart-no-axes-column" title="暂无图表数据" description="当前筛选条件没有资源指标。" />
        <UAlert v-else color="error" variant="subtle" title="图表加载失败" description="请稍后重试或查看数据表。" />
      </UCard>
    </div>
    <h3>数据表格 / Mock</h3>
    <table class="gp-table"><thead><tr><th>名称</th><th>状态</th><th>利用率</th></tr></thead><tbody><tr v-for="r in sampleRows" :key="r.id"><td>{{ r.name }}</td><td>{{ r.status }}</td><td>{{ r.utilization }}</td></tr></tbody></table>
    <UModal v-model:open="modalOpen" class="gp-modal" data-testid="component-modal" title="确认操作" description="M2 模拟交互，不会请求后端。"><template #body><p>这是 Nuxt UI 弹窗兼容性验证。</p><UButton class="gp-app-button gp-app-button--primary" @click="modalOpen = false">关闭</UButton></template></UModal>
  </section>
</template>
