import { atom } from 'recoil'

export const tokenAmountState = atom({
  key: 'tokenAmount',
  default: 0,
})

export const tokenANameState = atom({
  key: 'tokenAState',
  default: 'JUNO',
})

export const tokenBNameState = atom({
  key: 'tokenBState',
  default: 'POOD',
})
