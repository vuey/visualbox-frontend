<template lang="pug">
editor(v-if="ready")
  helper-container(slot="helper")
</template>

<script>
import { mapState, mapMutations, mapActions, mapGetters } from 'vuex'
import { Editor } from '@/components/editor'
import { HelperContainer } from '@/components/helper'
import EventBus from '@/lib/eventBus'

export default {
  name: 'Integration',
  components: {
    Editor,
    HelperContainer
  },
  computed: mapState('Project', ['ready', 'id', 'dirty']),
  methods: {
    ...mapGetters('Integration', ['integrationById']),
    ...mapActions('Integration', [
      'signedUrl',
      'commit',
      'commitFiles',
      'publish',
      'depublish'
    ]),
    ...mapMutations('Project', ['PROJECT_RESET']),
    ...mapActions('Project', [
      'load',
      'save',
      'saveFiles'
    ]),
    ...mapActions('App', [
      'setSnackbar',
      'setIsLoading'
    ]),
    async saveProject (files) {
      try {
        // Save files only (if dirty)
        if (files) {
          if (this.dirty.size > 0)
            await this.commitFiles(await this.saveFiles())

        // Save integration metadata
        } else
          await this.commit(await this.save())
      } catch (e) {
        throw e
      }
    }
  },
  async mounted () {
    EventBus.$on('vbox:saveProject', async (files = false) => {
      try {
        this.setIsLoading(true)
        await this.saveProject(files)
        this.setSnackbar({
          type: 'info',
          msg: `Saved integration`,
          timeout: 1000
        })
      } catch (e) {
        this.setSnackbar({
          type: 'error',
          msg: e.message
        })
      } finally {
        this.setIsLoading(false)
      }
    })

    // Should save project before publish?
    EventBus.$on('vbox:publishProject', async () => {
      try {
        this.setIsLoading(true)
        await this.publish(this.id)
        this.setSnackbar({
          type: 'info',
          msg: `Published integration`,
          timeout: 1000
        })
      } catch (e) {
        this.setSnackbar({
          type: 'error',
          msg: e.message
        })
      } finally {
        this.setIsLoading(false)
      }
    })

    // Should save project before publish?
    EventBus.$on('vbox:depublishProject', async () => {
      try {
        this.setIsLoading(true)
        await this.depublish(this.id)
        this.setSnackbar({
          type: 'info',
          msg: `Removed from registry`,
          timeout: 1000
        })
      } catch (e) {
        this.setSnackbar({
          type: 'error',
          msg: e.message
        })
      } finally {
        this.setIsLoading(false)
      }
    })

    try {
      const integration = this.integrationById()(this.$route.params.id)
      const signedUrl = await this.signedUrl(integration)
      await this.load({
        project: integration,
        signedUrl
      })
    } catch (e) {
      this.setSnackbar({
        type: 'error',
        msg: e.message
      })
    }
  },
  async beforeDestroy () {
    EventBus.$off('vbox:saveProject')
    EventBus.$off('vbox:publishProject')
    EventBus.$off('vbox:depublishProject')

    try {
      await this.saveProject(true)
      this.PROJECT_RESET()
    } catch (e) {
      this.setSnackbar({
        type: 'error',
        msg: e.message
      })
    }
  }
}
</script>
