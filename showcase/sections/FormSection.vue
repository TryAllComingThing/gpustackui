<script setup lang="ts">
import { reactive, ref } from 'vue'
import { z } from 'zod'

const schema = z.object({
  modelName: z.string().min(1, '请输入模型名称').regex(/^[a-z0-9-]+$/, '只能使用小写字母、数字和连字符'),
  profile: z.string().min(1, '请选择资源规格'),
  endpoint: z.string().url('请输入有效的 API 地址'),
})

type FormState = z.infer<typeof schema>
const initialState: FormState = { modelName: '', profile: '', endpoint: '' }
const state = reactive<FormState>({ ...initialState })
const formDisabled = ref(false)
const submitted = ref('')
const formError = ref('')
const fieldErrors = reactive<Record<keyof FormState, string | undefined>>({ modelName: undefined, profile: undefined, endpoint: undefined })
const profiles = [
  { label: 'A100 · 80GB', value: 'a100-80g' },
  { label: 'H800 · 80GB', value: 'h800-80g' },
  { label: 'L40S · 48GB', value: 'l40s-48g' },
]

function resetForm() {
  Object.assign(state, initialState)
  clearFieldErrors()
  submitted.value = ''
  formError.value = ''
}

function submitForm() {
  const result = schema.safeParse(state)
  clearFieldErrors()
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({ name: issue.path.join('.'), message: issue.message }))
    for (const error of errors) {
      if (error.name in fieldErrors) fieldErrors[error.name as keyof FormState] = error.message
    }
    formError.value = errors.map((error) => error.message).join('；')
    submitted.value = ''
    return
  }
  submitted.value = `已提交：${state.modelName}`
  formError.value = ''
}

function onError(event: { errors?: Array<{ name?: string; message?: string }> }) {
  clearFieldErrors()
  for (const error of event.errors ?? []) {
    if (error.name && error.name in fieldErrors) fieldErrors[error.name as keyof FormState] = error.message
  }
  formError.value = event.errors?.map((error) => error.message).filter(Boolean).join('；') || '请修正表单错误'
}

function clearFieldErrors() {
  fieldErrors.modelName = undefined
  fieldErrors.profile = undefined
  fieldErrors.endpoint = undefined
}
</script>

<template>
  <section class="gp-card demo-section drp-form-section" data-testid="section-form" aria-labelledby="form-heading">
    <div class="drp-section-heading">
      <div>
        <h2 id="form-heading">表单状态 / Zod + Nuxt UI</h2>
        <p>覆盖必填、格式校验、提交、重置和禁用状态。</p>
      </div>
      <UCheckbox v-model="formDisabled" label="禁用表单" />
    </div>
    <UForm :schema="schema" :state="state" :disabled="formDisabled" :loading-auto="false" class="drp-form" @submit="submitForm" @error="onError">
      <div class="drp-form-grid">
        <UFormField label="模型名称" name="modelName" :error="fieldErrors.modelName" required>
          <UInput v-model="state.modelName" placeholder="例如 llama-3-8b" />
        </UFormField>
        <UFormField label="资源规格" name="profile" :error="fieldErrors.profile" required>
          <USelect v-model="state.profile" :items="profiles" placeholder="选择 GPU 规格" />
        </UFormField>
        <UFormField label="API 地址" name="endpoint" :error="fieldErrors.endpoint" required class="drp-form-field--wide">
          <UInput v-model="state.endpoint" type="url" placeholder="https://api.example.com/v1" />
        </UFormField>
      </div>
      <div class="drp-form-actions">
        <UButton type="button" color="primary" @click="submitForm">提交表单</UButton>
        <UButton type="button" color="neutral" variant="outline" @click="resetForm">重置</UButton>
        <span v-if="submitted" class="drp-form-result" role="status">{{ submitted }}</span>
        <span v-if="formError" class="drp-form-error" role="alert" data-testid="form-error">{{ formError }}</span>
      </div>
    </UForm>
  </section>
</template>
