<script setup lang="ts">
import { ref } from 'vue'
import { z } from 'zod'
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import ComplexFormPattern, { type ComplexFormField } from '../../src/components/patterns/ComplexFormPattern.vue'
import DataTablePattern, { type DataTableQuery, type DataTableResult, type DataTableRowAction } from '../../src/components/patterns/DataTablePattern.vue'

const formSchema = z.object({
  project: z.string().min(1, '请输入项目名称'),
  environment: z.string().min(1, '请选择环境'),
  callback: z.string().url('请输入有效回调地址'),
  callbackConfirm: z.string().url('请输入有效回调地址'),
}).superRefine((value, context) => {
  if (value.callback !== value.callbackConfirm) context.addIssue({ code: z.ZodIssueCode.custom, path: ['callbackConfirm'], message: '两次回调地址必须一致' })
})
const formFields: ComplexFormField[] = [
  { name: 'project', label: '项目名称', placeholder: '例如 demo-saas', required: true },
  { name: 'environment', label: '环境', type: 'select', placeholder: '选择环境', required: true, options: [{ label: '测试', value: 'test' }, { label: '生产', value: 'prod' }] },
  { name: 'callback', label: '回调地址', type: 'url', placeholder: 'https://example.com/callback', required: true },
  { name: 'callbackConfirm', label: '确认回调地址', type: 'url', placeholder: '再次输入回调地址', required: true },
]
const submittedForm = ref(false)
async function submitForm() {
  await new Promise((resolve) => setTimeout(resolve, 180))
  submittedForm.value = true
}

interface DemoRow { id: string; name: string; status: string; owner: string; region: string }
const rows: DemoRow[] = [
  { id: 'saas-001', name: '控制台', status: '运行中', owner: '小张', region: '华东' },
  { id: 'saas-002', name: '训练任务', status: '待处理', owner: '小李', region: '华南' },
  { id: 'saas-003', name: '模型网关', status: '运行中', owner: '小王', region: '华北' },
  { id: 'saas-004', name: '审计服务', status: '已暂停', owner: '小赵', region: '华东' },
  { id: 'saas-005', name: '报表服务', status: '运行中', owner: '小张', region: '华南' },
  { id: 'saas-006', name: '通知服务', status: '待处理', owner: '小李', region: '华北' },
]
const columns: TableColumn<DemoRow>[] = [
  { accessorKey: 'name', header: '名称', enableSorting: true },
  { accessorKey: 'status', header: '状态', enableSorting: true },
  { accessorKey: 'owner', header: '负责人', enableSorting: true },
  { accessorKey: 'region', header: '区域', enableSorting: true },
]
const tableKey = ref(0)
const tableError = ref(false)
const viewModalOpen = ref(false)
const selectedRow = ref<DemoRow | null>(null)
const actions: DataTableRowAction<DemoRow>[] = [{ label: '查看', icon: 'i-lucide-eye', color: 'primary', onSelect: (row) => { selectedRow.value = row; viewModalOpen.value = true } }]
async function loadRows(query: DataTableQuery): Promise<DataTableResult<DemoRow>> {
  await new Promise((resolve) => setTimeout(resolve, 120))
  if (tableError.value) throw new Error('模拟数据源暂时不可用')
  const search = query.search.toLowerCase()
  const filtered = rows.filter((row) => !search || `${row.name}${row.owner}${row.region}`.toLowerCase().includes(search))
  const start = query.pagination.pageIndex * query.pagination.pageSize
  return { data: filtered.slice(start, start + query.pagination.pageSize), total: filtered.length }
}
function retryTable() { tableError.value = false; tableKey.value++ }
</script>

<template>
  <section class="gp-card demo-section pattern-section" data-testid="section-patterns" aria-labelledby="pattern-heading">
    <div class="gp-section-heading"><div><h2 id="pattern-heading">通用交互 Pattern</h2><p>复杂表单和数据表格只组合已有公共组件，不依赖业务 API。</p></div></div>
    <div class="pattern-grid">
      <div class="pattern-panel" data-testid="pattern-form">
        <h3>复杂表单</h3>
        <ComplexFormPattern :schema="formSchema" :initial-state="{ project: '', environment: '', callback: '', callbackConfirm: '' }" :fields="formFields" :submitter="submitForm" success-message="配置已保存" submit-label="异步提交" @success="submittedForm = true" />
        <p v-if="submittedForm" class="gp-form-result" role="status">异步提交完成</p>
      </div>
      <div class="pattern-panel" data-testid="pattern-table">
        <div class="pattern-panel__header"><div><h3>数据表格</h3><p class="pattern-hint">支持搜索、筛选、排序、分页和行操作。</p></div><UButton size="xs" color="neutral" variant="outline" @click="tableError = !tableError; tableKey++">{{ tableError ? '恢复数据' : '模拟错误' }}</UButton></div>
        <DataTablePattern :key="tableKey" :rows="rows" :columns="columns" :search-keys="['name', 'owner', 'region']" :filters="[{ key: 'region', label: '区域', options: [{ label: '华东', value: '华东' }, { label: '华南', value: '华南' }, { label: '华北', value: '华北' }] }]" :row-actions="actions" :load="loadRows" :page-size="3" />
        <UButton v-if="tableError" size="xs" color="primary" variant="outline" @click="retryTable">重试</UButton>
        <UModal v-model:open="viewModalOpen" title="资源详情" :description="selectedRow ? `${selectedRow.name} · ${selectedRow.id}` : '未选择资源'" data-testid="pattern-view-modal">
          <template #body>
            <dl v-if="selectedRow" class="pattern-detail-list">
              <div><dt>名称</dt><dd>{{ selectedRow.name }}</dd></div>
              <div><dt>状态</dt><dd>{{ selectedRow.status }}</dd></div>
              <div><dt>负责人</dt><dd>{{ selectedRow.owner }}</dd></div>
              <div><dt>区域</dt><dd>{{ selectedRow.region }}</dd></div>
            </dl>
          </template>
        </UModal>
      </div>
    </div>
  </section>
</template>
