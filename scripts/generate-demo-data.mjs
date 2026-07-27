import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const storeCounts = [
  ['store-beef-01', 8],
  ['store-beef-02', 23],
  ['store-chicken-01', 23],
  ['store-pork-01', 23],
  ['store-veggie-01', 23],
]

const validations = storeCounts.flatMap(([storeId, count], storeIndex) =>
  Array.from({ length: count }, (_, index) => {
    const isHero = storeId === 'store-beef-01'
    const separatedPackaging = isHero ? true : index % (storeIndex + 2) !== 0
    const lowOilRequestMet = isHero ? index !== 6 : index % (storeIndex + 3) !== 0
    const standardProteinMet = isHero ? index !== 5 : index % 5 !== 0
    const oiliness = isHero
      ? index < 3
        ? 'light'
        : index < 7
          ? 'balanced'
          : 'rich'
      : index % 4 === 0
        ? 'rich'
        : storeIndex === 2
          ? 'light'
          : 'balanced'

    return {
      id: `validation-${String(storeIndex + 1).padStart(2, '0')}-${String(index + 1).padStart(3, '0')}`,
      storeId,
      orderId: `demo-order-${storeIndex + 1}-${index + 1}`,
      orderCompleted: true,
      status: 'verified',
      separatedPackaging,
      lowOilRequestMet,
      standardProteinMet,
      oiliness,
      portion: index % 5 === 0 ? 'generous' : index % 3 === 0 ? 'light' : 'enough',
      fullPriceRepurchaseIntent: isHero ? index !== 7 : index % 4 !== 0,
      addedToFrequent: isHero ? index < 5 : index % 3 !== 0,
      actualFullPriceRepurchase: isHero ? index < 3 : index % 5 === 0,
      createdAt: `2026-07-${String(12 + (index % 9)).padStart(2, '0')}T12:${String((index * 7) % 60).padStart(2, '0')}:00+08:00`,
      isDemoData: true,
    }
  }),
)

writeFileSync(
  resolve(root, 'src/data/validations.json'),
  `${JSON.stringify(validations, null, 2)}\n`,
  'utf8',
)
