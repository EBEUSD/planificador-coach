import { zonedTimeToUtc } from 'date-fns-tz'

export function aUtc(fecha, zona) {
  return zonedTimeToUtc(fecha, zona)
}
