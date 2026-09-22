import type { RegionTheme, RugDesign } from '../api'

/** Small deterministic PRNG so every region's preview always looks the same. */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const seedOf = (text: string) => [...text].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7)

/**
 * A mini rug in the region's weaving style (portrait, 12×9 knots), rendered with <RugView>.
 * Each pattern is a simplified, recognisable version of the regional style.
 */
export function regionRug(theme: RegionTheme, rows = 12, cols = 9): RugDesign {
  const c = (i: number) => theme.colors[i % theme.colors.length]
  const rand = rng(seedOf(theme.pattern + theme.colors.join('')))
  const cr = (rows - 1) / 2
  const cc = (cols - 1) / 2
  const cell = (r: number, k: number): string => {
    const edge = r === 0 || r === rows - 1 || k === 0 || k === cols - 1
    switch (theme.pattern) {
      case 'stripes': // Rif mendil: red & white bands with thin blue/black lines
        return [c(0), c(0), c(1), c(1), c(2), c(1), c(1), c(0), c(0), c(1), c(3), c(1)][r % 12]
      case 'bands': { // Oriental: bands of zigzag triangles separated by dark lines
        const rr = r % 4
        if (rr === 0) return c(3)
        return (k + rr) % 4 < 2 ? c(Math.floor(r / 4) % 2) : c(2)
      }
      case 'lozenge': // Beni Ourain: cream pile, dark diamond lattice
        if ((r + k) % 6 === 0 || (r - k + 60) % 6 === 0) return c(1)
        return rand() < 0.12 ? c(2) : c(0)
      case 'medallion': { // Rbati: borders + central medallion
        if (edge) return c(1)
        if (r === 1 || k === 1 || r === rows - 2 || k === cols - 2) return c(2)
        const d = Math.abs(r - cr) + Math.abs(k - cc)
        return d <= 1 ? c(2) : d <= 3 ? c(1) : d <= 3.6 ? c(3) : c(0)
      }
      case 'patchwork': // Boucherouite: patches of recycled fabric
        return c(Math.floor(r / 3) * 7 + Math.floor(k / 3) * 3 + (rand() < 0.15 ? 1 : 0))
      case 'playful': // Azilal: cream with free, bright symbols
        if ((r === 3 || r === 8) && k % 2 === 0) return c(1 + (r % 3))
        return rand() < 0.16 ? c(1 + Math.floor(rand() * (theme.colors.length - 1))) : c(0)
      case 'red_field': { // Chichaoua: red field, a few simple motifs
        for (const [mr, mk] of [[3, 2], [3, 6], [8, 4]]) {
          const d = Math.abs(r - mr) + Math.abs(k - mk)
          if (d === 0) return c(3)
          if (d === 1) return c(1)
        }
        return (r === 0 || r === rows - 1) && k % 2 === 0 ? c(2) : c(0)
      }
      case 'mixed': { // Glaoua / Taznakht: flatweave stripes alternating with knotted diamond rows
        const rr = r % 4
        if (rr < 2) return rr === 0 ? c(1) : c(3)
        return k % 4 === 1 || k % 4 === 2 ? (rr === 2 ? c(2) : c(1)) : c(0)
      }
      case 'fine_stripes': { // Anti-Atlas: fine stripes and small triangles
        if (r % 6 === 3) return k % 3 === 1 ? c(2) : c(0)
        return [c(3), c(0), c(1), c(0), c(2), c(0)][r % 6]
      }
      case 'tent': // Nomad tent strips: dark goat hair with bold light bands
        if (r % 6 === 1) return c(2)
        if (r % 6 === 2) return c(1)
        return k % 3 === 0 ? c(3) : c(0)
      case 'stitch': { // Sahrawi: leather with stitched stars
        for (const [mr, mk] of [[3, 4], [8, 4]]) {
          const dr = Math.abs(r - mr)
          const dk = Math.abs(k - mk)
          if (dr === 0 && dk === 0) return c(3)
          if ((dr === 0 && dk <= 2) || (dk === 0 && dr <= 2)) return c(1)
          if (dr === 1 && dk === 1) return c(2)
        }
        return edge && (r + k) % 2 === 0 ? c(2) : c(0)
      }
      case 'waves': { // Dakhla: ocean waves and dunes
        const tri = Math.abs((k % 4) - 2)
        if ((r + tri) % 6 === 0) return c(2)
        return (r + tri) % 6 < 3 ? c(0) : c(1)
      }
      default:
        return c(0)
    }
  }
  const cells: string[] = []
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) cells.push(cell(r, k))
  return { rows, cols, cells, motifs: [], texture: theme.pattern === 'lozenge' ? 'wool' : 'cotton' }
}
