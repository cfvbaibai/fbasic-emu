/**
 * useShareRoute composable
 *
 * Handles decoding shared programs from the URL hash fragment
 * and loading them into the IDE on page load.
 */

import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { decodeProgram, ProgramDecodeError } from '@/shared/utils/programCodec'

/**
 * Composable for handling share route decoding.
 *
 * When the user navigates to `/#/share/<encoded-data>`,
 * this decodes the program, loads it into the editor, and
 * redirects to the normal IDE route.
 *
 * @param state - The IDE state to load the program code into
 * @returns shareError - Reactive error message if decoding fails
 */
export function useShareRoute(state: { code: { value: string } }) {
  const route = useRoute()
  const router = useRouter()
  const shareError = ref('')

  async function handleShareRoute(): Promise<void> {
    const shareData = route.params.data as string | undefined
    if (!shareData) return

    try {
      const payload = await decodeProgram(shareData)

      // Load the program code into IDE state (triggers sync to program store via watch)
      state.code.value = payload.c

      // Redirect to normal IDE route (clean URL)
      void router.replace({ name: 'Ide' })
    } catch (err) {
      if (err instanceof ProgramDecodeError) {
        shareError.value = err.message
      } else {
        shareError.value = String(err)
      }
      void router.replace({ name: 'Ide' })
    }
  }

  return {
    shareError,
    handleShareRoute,
  }
}
