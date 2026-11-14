<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { z } from 'zod'
import { updatePassword } from '../../api/auth'
import { resolveLogoutRedirect } from '../../services/auth/logout'
import { useAuthStore } from '../../stores/auth'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const state = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const error = ref('')
const success = ref('')
const logoutWarning = ref('')
const submitting = ref(false)

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
  confirmPassword: z.string().min(1),
}).superRefine((value, context) => {
  if (value.newPassword !== value.confirmPassword) {
    context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'mismatch' })
  }
})

function validationError(): string {
  const parsed = passwordSchema.safeParse(state)
  if (parsed.success) return ''
  const issue = parsed.error.issues[0]
  return issue?.path[0] === 'confirmPassword' && issue.message === 'mismatch'
    ? t('auth.password.mismatch')
    : t('auth.password.required')
}

function requestError(code: string): string {
  if (code === 'NETWORK' || code === 'TIMEOUT' || code === 'SERVER') return t('auth.errors.unavailable')
  return t('auth.password.failed')
}

async function submit() {
  if (submitting.value) return
  error.value = ''
  success.value = ''
  logoutWarning.value = ''

  const validation = validationError()
  if (validation) {
    error.value = validation
    return
  }

  submitting.value = true
  const result = await updatePassword(state.currentPassword, state.newPassword)
  if (!result.ok) {
    submitting.value = false
    error.value = requestError(result.error.code)
    return
  }

  state.currentPassword = ''
  state.newPassword = ''
  state.confirmPassword = ''
  success.value = t('auth.password.success')

  const logoutResult = await auth.logout()
  submitting.value = false
  if (logoutResult.ok) {
    const redirect = resolveLogoutRedirect(logoutResult.data)
    if (redirect) {
      window.location.assign(redirect)
      return
    }
    await router.replace({ name: 'login' })
    return
  }

  if (logoutResult.error.code === 'UNAUTHORIZED') {
    auth.clear()
    await router.replace({ name: 'login' })
    return
  }

  logoutWarning.value = t('auth.password.logoutIncomplete')
}
</script>

<template>
  <section class="gp-page" data-testid="production-password-change">
    <header class="gp-page-header">
      <div>
        <h1 class="gp-page-title">{{ t('auth.password.title') }}</h1>
        <p class="gp-secondary">{{ t('auth.password.subtitle') }}</p>
      </div>
    </header>
    <div class="gp-card gp-password-card">
      <UForm :state="state" :disabled="submitting" class="gp-auth-form" @submit="submit">
        <UFormField :label="t('auth.password.current')" name="currentPassword" required>
          <UInput
            v-model="state.currentPassword"
            name="current-password"
            type="password"
            autocomplete="current-password"
            class="gp-auth-input"
          />
        </UFormField>
        <UFormField :label="t('auth.password.next')" name="newPassword" required>
          <UInput
            v-model="state.newPassword"
            name="new-password"
            type="password"
            autocomplete="new-password"
            class="gp-auth-input"
          />
        </UFormField>
        <UFormField :label="t('auth.password.confirm')" name="confirmPassword" required>
          <UInput
            v-model="state.confirmPassword"
            name="confirm-password"
            type="password"
            autocomplete="new-password"
            class="gp-auth-input"
          />
        </UFormField>
        <UAlert v-if="error" color="error" variant="subtle" :title="error" role="alert" data-testid="password-error" />
        <UAlert v-if="success" color="success" variant="subtle" :title="success" role="status" data-testid="password-success" />
        <UAlert v-if="logoutWarning" color="warning" variant="subtle" :title="logoutWarning" role="alert" data-testid="password-logout-warning" />
        <UButton type="submit" color="primary" block :loading="submitting" :disabled="submitting">
          {{ submitting ? t('auth.password.submitting') : t('auth.password.submit') }}
        </UButton>
      </UForm>
    </div>
  </section>
</template>

<style scoped>
.gp-password-card { width: min(560px, 100%); }
</style>
