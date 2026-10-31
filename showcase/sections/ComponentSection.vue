<script setup lang="ts">
import { ref } from 'vue'
import { sampleRows } from '../fixtures/sample'
const name = ref('')
const modalOpen = ref(false)
const count = ref(0)
</script>
<template>
  <section class="gp-card demo-section" aria-labelledby="component-heading">
    <h2 id="component-heading">组件状态 / Nuxt UI</h2>
    <div class="demo-row">
      <UButton class="gp-button gp-button--primary" @click="count++">主按钮 · {{ count }}</UButton>
      <UButton disabled>禁用按钮</UButton>
      <UButton loading>加载中</UButton>
      <UButton variant="outline" @click="modalOpen = true">打开弹窗</UButton>
    </div>
    <div class="demo-row"><label for="demo-name">模型名称</label><UInput id="demo-name" v-model="name" placeholder="请输入模型名称" /><span>输入值：{{ name || '（空）' }}</span></div>
    <h3>数据表格 / Mock</h3>
    <table class="gp-table"><thead><tr><th>名称</th><th>状态</th><th>利用率</th></tr></thead><tbody><tr v-for="r in sampleRows" :key="r.id"><td>{{ r.name }}</td><td>{{ r.status }}</td><td>{{ r.utilization }}</td></tr></tbody></table>
    <UModal v-model:open="modalOpen" title="确认操作" description="M2 模拟交互，不会请求后端。"><template #body><p>这是 Nuxt UI 弹窗兼容性验证。</p><UButton @click="modalOpen = false">关闭</UButton></template></UModal>
  </section>
</template>
