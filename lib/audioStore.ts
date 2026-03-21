interface AudioState { blobUrl: string|null; duration: number; mimeType: string }
const state: AudioState = { blobUrl: null, duration: 0, mimeType: 'audio/webm' }
export const audioStore = {
  set(blobUrl: string, duration: number, mimeType: string) {
    if (state.blobUrl && state.blobUrl !== blobUrl) URL.revokeObjectURL(state.blobUrl)
    state.blobUrl = blobUrl; state.duration = duration; state.mimeType = mimeType
  },
  get(): AudioState { return { ...state } },
  clear() { if (state.blobUrl) URL.revokeObjectURL(state.blobUrl); state.blobUrl=null; state.duration=0; state.mimeType='audio/webm' },
  hasAudio(): boolean { return state.blobUrl !== null },
}
