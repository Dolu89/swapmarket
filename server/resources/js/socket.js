import { io } from 'socket.io-client'

export const wsClient = io('/client', { path: '/ws' })
