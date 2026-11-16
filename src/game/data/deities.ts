// Divinità — fonte: Omnia › Razze e Classi (sezione Sacerdoti)

export interface Deity {
  key: string
  name: string
  domain: string
}

export const DEITIES: readonly Deity[] = [
  { key: 'xenea', name: 'Xenea', domain: 'Dea della terra e della natura vegetale e animale' },
  { key: 'vex', name: 'Vex', domain: 'Dea della vita e della prosperità' },
  { key: 'morgoroth', name: 'Morgoroth', domain: 'Dio della morte' },
  { key: 'tarooth', name: 'Tarooth', domain: 'Dio del tempo e dello spazio' },
  { key: 'ydelx', name: 'Ydelx', domain: 'Dea Madre della guerra e della saggezza' },
  { key: 'xutux_nero', name: 'Xutux Nero', domain: 'Dio del male e delle anime' },
  { key: 'xutux_bianco', name: 'Xutux Bianco', domain: 'Dio del bene e delle anime' },
  { key: 'zeria', name: 'Zeria', domain: 'Dio della magia e del creato' },
]

export function findDeity(key: string | null | undefined): Deity | undefined {
  return DEITIES.find((d) => d.key === key)
}
