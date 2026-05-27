export interface ABTest {
  id: string
  name: string
  variants: Record<string, string>
}

export const AB_TESTS: ABTest[] = [
  {
    id: 'checkout_headline',
    name: 'Headline do checkout',
    variants: {
      A: 'Dê o primeiro passo com segurança.',
      B: 'O primeiro passo mais importante do seu projeto.',
    },
  },
]

export function getABTest(id: string): ABTest | undefined {
  return AB_TESTS.find(t => t.id === id)
}
