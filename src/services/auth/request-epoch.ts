let authEpoch = 0

export function currentAuthEpoch(): number {
  return authEpoch
}

export function advanceAuthEpoch(): number {
  authEpoch += 1
  return authEpoch
}

export function resetAuthEpochForTests() {
  authEpoch = 0
}
