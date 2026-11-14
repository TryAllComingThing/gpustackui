<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../stores/auth'
import { getAuthConfig } from '../../api/auth'
import { resolvePostLoginRedirect } from '../router/redirect'
import { productConfig } from '../../config/product'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const productName = productConfig.name
const ssoLoginUrl = productConfig.ssoLoginUrl
const state = reactive({ username: '', password: '' })
const error = ref('')
const submitting = ref(false)
const ssoEnabled = ref(false)

onMounted(async () => {
  const result = await getAuthConfig()
  if (!result.ok) return
  ssoEnabled.value = result.data.is_saml === true || result.data.is_oidc === true
})

function loginError(code: string): string {
  if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN') return t('auth.errors.invalidCredentials')
  if (code === 'CSRF') return t('auth.errors.security')
  if (code === 'RATE_LIMIT') return t('auth.errors.rateLimited')
  if (code === 'NETWORK' || code === 'TIMEOUT' || code === 'SERVER') return t('auth.errors.unavailable')
  return t('auth.errors.generic')
}

async function submit() {
  if (submitting.value) return
  error.value = ''
  if (!state.username.trim() || !state.password) {
    error.value = t('auth.errors.required')
    return
  }

  const redirect = resolvePostLoginRedirect(route.query.redirect)
  submitting.value = true
  const result = await auth.login(state.username.trim(), state.password)
  submitting.value = false
  if (!result.ok) {
    error.value = loginError(result.error.code)
    return
  }
  await router.replace(redirect)
}
</script>

<template>
  <main class="gp-auth-layout" data-testid="login-page">
    <section class="gp-auth-card gp-card" aria-labelledby="login-heading">
      <header class="gp-auth-header">
        <p class="gp-auth-brand">{{ productName }}</p>
        <h1 id="login-heading" class="gp-page-title">{{ t('auth.login.title', { name: productName }) }}</h1>
        <p class="gp-auth-subtitle">{{ t('auth.login.subtitle') }}</p>
      </header>
      <UForm :state="state" :disabled="submitting" class="gp-auth-form" @submit="submit">
        <UFormField :label="t('auth.login.username')" name="username" required>
          <UInput
            v-model="state.username"
            name="username"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
            class="gp-auth-input"
          />
        </UFormField>
        <UFormField :label="t('auth.login.password')" name="password" required>
          <UInput
            v-model="state.password"
            name="password"
            type="password"
            autocomplete="current-password"
            class="gp-auth-input"
          />
        </UFormField>
        <UAlert v-if="error" color="error" variant="subtle" :title="error" role="alert" />
        <UButton type="submit" color="primary" block :loading="submitting" :disabled="submitting">
          {{ submitting ? t('auth.login.submitting') : t('auth.login.submit') }}
        </UButton>
      </UForm>
      <section v-if="ssoEnabled" class="gp-auth-sso" data-testid="sso-login">
        <div class="gp-auth-divider"><span>{{ t('auth.sso.divider') }}</span></div>
        <a v-if="ssoLoginUrl" :href="ssoLoginUrl" class="gp-auth-sso-link" data-testid="sso-login-link">
          {{ t('auth.sso.continue') }}
        </a>
        <UAlert
          v-else
          color="warning"
          variant="subtle"
          :title="t('auth.sso.unavailable')"
          data-testid="sso-login-unavailable"
        />
      </section>
    </section>
  </main>
</template>
