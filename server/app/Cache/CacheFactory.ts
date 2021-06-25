import Keyv from 'keyv'

export const BROKERS_KEY = 'brokers'
export const CLIENTS_KEY = 'clients'
export const brokerCache = new Keyv({ namespace: BROKERS_KEY })
export const clientCache = new Keyv({ namespace: CLIENTS_KEY })
