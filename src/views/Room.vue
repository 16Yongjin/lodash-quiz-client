<template lang="pug">
.container.is-relative
  .section
    nav.is-flex.is-justify-content-space-between
      h1.title {{ roomId }}
      div(v-if="me") 내 점수: {{ me.score }}

    div(v-if="game")
      .user-container
        div.user(
          v-for="user in game.users"
          :style="{ background: colorize(user.name) }"
          :class="{finished: user.finished, gaveUp: user.answer === '포기' }")
          .text {{ user.name }}
      hr
      div(v-if="game.completed")
        .title 게임 종료
        div.mt-4
          b-table(:data="sortedUsers" :columns="userTableColumns" :selected="me")

      div(v-if="!game.inProgress")
        div(v-if="game.quiz")
          div.title 퀴즈 {{ game.quizIndex + 1 }}

          div 입력
            pre
              code {{ game.quiz.input }}
          div 출력
            pre
              code {{ game.quiz.output }}
          div 정답:
            pre
              code {{ game.quiz.answer }}
          div
            a(:href="getDocFromAnswer(game.quiz.answer)" target="_blank") 문서 링크

          div.mt-4
            .title 리더보드
            b-table(:data="sortedUsers" :columns="userTableColumns" :selected="me")

        .is-flex.is-justify-content-end.mt-4(v-if="!game.completed")
          b-button(@click="startGame" type="is-success") 시작하기
        div(v-else) 게임 종료
      div(v-else-if="game.quiz")
        div.title 퀴즈 {{ game.quizIndex + 1 }}
        b-progress(:value="timeLeftPercent" type="is-info" show-value) {{ formatTime(timeLeft) }}초
        div 입력:
        pre
          code.javascript {{ game.quiz.input }}
        div 출력:
          pre
            code {{ game.quiz.output }}
        div(v-if="me.finished")
          div(v-if="me.answer !== '포기'")
            div 정답입니다!
            div 입력 정답:
              pre
                code {{ me.answer }}
          div 실제 정답:
            pre
              code {{ game.quiz.answer }}
        div(v-else)
          b-field(label="정답 입력" :type="answerError ? 'is-danger' : ''" :message="answerError")
            b-input(v-model="answer" @keydown.native.enter="submit" expanded)
            p.control
              b-button(@click="submit" type="is-success") 제출
            p.control
              b-button(@click="giveUp" type="is-warning") 포기
        div.fab
          b-button(@click="endGame" type="is-danger is-light") 게임 끝내기
</template>

<script lang="ts">
/* eslint-disable no-eval */

import { Component, Prop, Vue } from 'vue-property-decorator'
import { Game } from '@/model'
import { colorize } from '@/utils'

// eslint-disable-next-line
const noop = (any: number) => {}

const errorGuard = (fn: Function): boolean => {
  try {
    return fn()
  } catch (e) {
    return false
  }
}

@Component
export default class Room extends Vue {
  @Prop() private msg!: string

  answer = ''

  answerError = ''

  timeLeftId = 0

  colorize = colorize

  userTableColumns = [
    {
      field: 'name',
      label: '이름',
      width: '150'
    },
    {
      field: 'score',
      label: '점수',
      width: '150'
    },
    {
      field: 'answer',
      label: '답'
    }
  ]

  get roomId() {
    return this.$route.params.id
  }

  get game(): Game {
    return this.$store.state.game
  }

  get sortedUsers() {
    return this.game?.users.slice().sort((u1, u2) => u2.score - u1.score) ?? []
  }

  get me() {
    return this.game?.users.find(user => user.name === this.username)
  }

  formatTime(time: number) {
    return ~~(time / 1000)
  }

  get timeLeft() {
    noop(this.timeLeftId)
    const end = this.game?.dueDate.getTime()
    const current = new Date().getTime()
    return end - current
  }

  get timeLeftPercent() {
    return 100 - this.timeLeft / (3 * 60 * 10)
  }

  get username() {
    return this.$store.state.username
  }

  getDocFromAnswer(answer: string) {
    const fnName = answer.match(/_\.(.+)\(/)?.[1]
    const url = `https://lodash.com/docs/4.17.15#${fnName}`
    return url
  }

  startGame() {
    this.$socket.emit('GAME_START', this.roomId)
  }

  submit() {
    this.answerError = ''

    const isCorrect =
      this.answer.includes('_.') &&
      errorGuard(() => {
        const myOutput = JSON.stringify(
          eval(this.answer.replace('input', this.game.quiz?.input || 'input'))
        )
        console.log('내 출력:', myOutput)
        return (
          myOutput === JSON.stringify(eval(`(${this.game.quiz?.output})` || ''))
        )
      })

    if (isCorrect) {
      this.$socket.emit('USER_GAME_FINISHED', {
        roomId: this.roomId,
        username: this.username,
        answer: this.answer
      })

      this.answer = ''
    } else {
      this.answerError = '틀렸습니다.'
    }
  }

  giveUp() {
    this.$socket.emit('USER_GAME_FINISHED', {
      roomId: this.roomId,
      username: this.username,
      answer: '포기',
      giveUp: true
    })
    this.answer = ''
    this.answerError = ''
  }

  endGame() {
    this.$socket.emit('GAME_END', this.roomId)
  }

  joinRoom() {
    this.$socket.emit('ROOM_JOIN', {
      roomId: this.roomId,
      username: this.username
    })
  }

  setUsername(username: string) {
    this.$store.commit('SET_USERNAME', username)
  }

  mounted() {
    if (!this.username) {
      const username = prompt('이름을 입력해주세요.')
      if (!username) return location.reload()
      this.setUsername(username)
    }

    if (this.username) this.joinRoom()

    this.updateTimeLeft()
  }

  unmounted() {
    this.$socket.emit('ROOM_LEAVE', {
      roomId: this.roomId,
      username: this.username
    })
  }

  updateTimeLeft() {
    this.timeLeftId++
    setTimeout(() => this.updateTimeLeft(), 1000)
  }
}
</script>

<style lang="scss">
.user {
  border: 0.5rem solid white;
  width: 100px;
  height: 100px;
  border-radius: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  color: white;

  &-container {
    display: flex;
    gap: 1rem;
  }

  &.finished {
    border: 0.5rem solid green;
  }

  &.gaveUp {
    border: 0.5rem solid orange !important;
  }
}

.container {
  height: 100vh;
}

.fab {
  position: absolute;
  bottom: 4rem;
  right: 0;
}

.rel {
  position: relative;
}
</style>
