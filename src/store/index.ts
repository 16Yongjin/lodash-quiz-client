import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    username: JSON.parse(localStorage.getItem('QUIZ_USERNAME') || 'null'),

    game: null,

    rooms: []
  },
  mutations: {
    SET_USERNAME(state, username) {
      localStorage.setItem('QUIZ_USERNAME', JSON.stringify(username))
      state.username = username
    },

    SET_GAME(state, game) {
      state.game = game
    },

    SET_ROOMS(state, rooms) {
      state.rooms = rooms
    }
  },
  actions: {
    SOCKET_GAME_UPDATE({ commit }, game) {
      console.log(game)
      commit('SET_GAME', { ...game, dueDate: new Date(game.dueDate) })
    }
  },
  modules: {}
})
