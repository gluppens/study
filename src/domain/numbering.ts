import type { NumberingToken } from "./types"

const romanMap: Array<[number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
]

function roman(value: number) {
  let remaining = value
  let output = ""

  for (const [amount, symbol] of romanMap) {
    while (remaining >= amount) {
      output += symbol
      remaining -= amount
    }
  }

  return output
}

function alpha(value: number) {
  let n = value
  let label = ""

  while (n > 0) {
    n -= 1
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26)
  }

  return label
}

export function labelForLevel(level: number, ordinal: number) {
  if (level === 0) return roman(ordinal)
  if (level === 1) return alpha(ordinal)
  if (level === 2) return alpha(ordinal).toLowerCase()
  if (level === 3) return roman(ordinal).toLowerCase()
  if (level === 4) return String(ordinal)
  return String(ordinal)
}

export function styleForLevel(level: number): NumberingToken["style"] {
  if (level === 0) return "roman_upper"
  if (level === 1) return "alpha_upper"
  if (level === 2) return "alpha_lower"
  if (level === 3) return "roman_lower"
  if (level === 4) return "decimal"
  return "section"
}

export function makeNumberingPath(parentPath: NumberingToken[], level: number, ordinal: number) {
  const label = labelForLevel(level, ordinal)
  return [
    ...parentPath,
    {
      level,
      ordinal,
      label,
      style: styleForLevel(level),
    },
  ]
}

export function displayNumber(path: NumberingToken[]) {
  if (path.length <= 5) return path.map((token) => token.label).join(".")

  return `§${path.map((token) => token.label).join(".")}`
}
