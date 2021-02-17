export interface Quiz {
  input: string
  output: string
  answer: string
}

export interface User {
  name: string
  roomId: string
  finished: boolean
  score: number
}

export interface Room {
  id: string
  dueDate: Date
  completed: boolean
  inProgress: boolean
  users: User[]
}
export interface Game {
  id: string
  dueDate: Date
  completed: boolean
  inProgress: boolean
  quiz?: Quiz
  users: User[]
}
