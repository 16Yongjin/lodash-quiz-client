<template lang="pug">
.container
  header.is-flex.is-justify-content-space-between
    h1.title.is-1 lodash quiz
    div.mt-5
      b-button(@click="makeNewRoom") 새 방 만들기
  .columns.is-desktop.is-multiline
    .column.is-one-quarter(v-for="room in rooms")
      .card
        .card-content
          .title {{ room.id }}
          div
            b-icon(icon="user" size="is-small")
            span.ml-2 {{ room.users.length }}명
          .card-action.is-flex.is-justify-content-end
            router-link(:to="`/room/${room.id}`")
              b-button(type="is-success") 참여
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { Room } from '@/model'

@Component
export default class Home extends Vue {
  rooms: Room[] = []

  makeNewRoom() {
    const roomId = prompt('방 이름을 입력해주세요.')
    this.$router.push(`/room/${roomId}`)
  }

  created() {
    this.sockets.subscribe('ROOM_UPDATE', (rooms: Room[]) => {
      this.rooms = rooms
    })

    this.$socket.emit('LOBBY_JOIN')
  }

  destroy() {
    this.sockets.unsubscribe('ROOM_UPDATE')
  }
}
</script>

<style lang="scss">
.card {
  height: 100%;
}
</style>
