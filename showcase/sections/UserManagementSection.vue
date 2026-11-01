<script setup lang="ts">
import { ref } from 'vue'
import { z } from 'zod'
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import ComplexFormPattern, { type ComplexFormField } from '../../src/components/patterns/ComplexFormPattern.vue'
import DataTablePattern, { type DataTableQuery, type DataTableResult } from '../../src/components/patterns/DataTablePattern.vue'
import DrpModal from '../../src/components/common/DrpModal.vue'
import { showcaseUsers, type ShowcaseUser } from '../fixtures/users'

const users = ref<ShowcaseUser[]>([...showcaseUsers])
const tableKey = ref(0)
const modalOpen = ref(false)
const simulateError = ref(false)
const simulateLoading = ref(false)
const feedback = ref('')

const columns: TableColumn<ShowcaseUser>[] = [
  { accessorKey: 'name', header: '姓名', enableSorting: true },
  { accessorKey: 'email', header: '邮箱', enableSorting: true },
  { accessorKey: 'role', header: '角色', enableSorting: true },
  { accessorKey: 'status', header: '状态', enableSorting: true },
  { accessorKey: 'lastActive', header: '最后活跃', enableSorting: true },
]

const userFilters = [
  { key: 'role', label: '角色筛选', options: [{ label: '管理员', value: '管理员' }, { label: '编辑者', value: '编辑者' }, { label: '查看者', value: '查看者' }] },
  { key: 'status', label: '状态筛选', options: [{ label: '启用', value: '启用' }, { label: '停用', value: '停用' }] },
]

async function loadUsers(query: DataTableQuery): Promise<DataTableResult<ShowcaseUser>> {
  simulateLoading.value = true
  await new Promise((resolve) => setTimeout(resolve, 160))
  simulateLoading.value = false
  if (simulateError.value) throw new Error('用户目录暂时不可用，请重试')
  const term = query.search.trim().toLowerCase()
  const filtered = users.value.filter((user) => {
    const matchesSearch = !term || `${user.name}${user.email}${user.role}`.toLowerCase().includes(term)
    const matchesRole = !query.filters.role || user.role === query.filters.role
    const matchesStatus = !query.filters.status || user.status === query.filters.status
    return matchesSearch && matchesRole && matchesStatus
  })
  const sorted = [...filtered]
  const sort = query.sorting[0]
  if (sort?.id) {
    sorted.sort((left, right) => String(left[sort.id as keyof ShowcaseUser]).localeCompare(String(right[sort.id as keyof ShowcaseUser]), 'zh-CN') * (sort.desc ? -1 : 1))
  }
  const start = query.pagination.pageIndex * query.pagination.pageSize
  return { data: sorted.slice(start, start + query.pagination.pageSize), total: sorted.length }
}

const userSchema = z.object({
  name: z.string().min(1, '请输入姓名'),
  email: z.string().email('请输入有效邮箱'),
  role: z.string().min(1, '请选择角色'),
  password: z.string().min(8, '密码至少 8 位'),
  passwordConfirm: z.string().min(1, '请确认密码'),
}).superRefine((value, context) => {
  if (value.password !== value.passwordConfirm) context.addIssue({ code: z.ZodIssueCode.custom, path: ['passwordConfirm'], message: '两次密码必须一致' })
})

const formFields: ComplexFormField[] = [
  { name: 'name', label: '姓名', placeholder: '例如 小孙', required: true },
  { name: 'email', label: '邮箱', type: 'text', placeholder: 'user@example.com', required: true },
  { name: 'role', label: '角色', type: 'select', placeholder: '选择角色', required: true, options: userFilters[0].options },
  { name: 'password', label: '密码', type: 'text', placeholder: '至少 8 位', required: true },
  { name: 'passwordConfirm', label: '确认密码', type: 'text', placeholder: '再次输入密码', required: true },
]

async function createUser(state: Record<string, unknown>) {
  await new Promise((resolve) => setTimeout(resolve, 180))
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  users.value = [{ id: `user-${String(users.value.length + 1).padStart(3, '0')}`, name: String(state.name), email: String(state.email), role: String(state.role), status: '启用', lastActive: now }, ...users.value]
  tableKey.value++
  modalOpen.value = false
  feedback.value = `已新增用户：${String(state.name)}`
}

function retryUsers() {
  simulateError.value = false
  tableKey.value++
}
</script>

<template>
  <section class="gp-card demo-section user-management-section" data-testid="section-user-management" aria-labelledby="user-management-heading">
    <div class="drp-section-heading">
      <div><h2 id="user-management-heading">通用用户管理</h2><p>独立验收页面：本地模拟数据，不连接 GPU 业务接口。</p></div>
      <div class="user-management-actions"><UButton data-testid="user-add-open" @click="modalOpen = true">新增用户</UButton><UButton data-testid="user-error-toggle" color="neutral" variant="outline" @click="simulateError = !simulateError; tableKey++">{{ simulateError ? '恢复列表' : '模拟错误' }}</UButton></div>
    </div>
    <div class="user-management-status" role="status"><span>列表、搜索、筛选、排序、分页</span><span v-if="simulateLoading">加载中…</span><span v-if="feedback">{{ feedback }}</span></div>
    <DataTablePattern :key="tableKey" :rows="users" :columns="columns" :search-keys="['name', 'email', 'role']" :filters="userFilters" :load="loadUsers" :page-size="3" empty-message="暂无匹配用户" aria-label="用户管理数据表格" />
    <UButton v-if="simulateError" data-testid="user-error-retry" size="sm" variant="outline" color="primary" @click="retryUsers">重试</UButton>
    <DrpModal v-model:open="modalOpen" title="新增用户" description="使用 Zod 校验并模拟异步提交。" data-testid="user-add-modal">
      <template #body><ComplexFormPattern :schema="userSchema" :initial-state="{ name: '', email: '', role: '', password: '', passwordConfirm: '' }" :fields="formFields" submit-label="保存用户" success-message="用户已保存" :submitter="createUser" /></template>
    </DrpModal>
  </section>
</template>
