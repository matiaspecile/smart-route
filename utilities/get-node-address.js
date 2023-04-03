import { getAddressArray } from './get-address-array'

export function getNodeAddress(address, index) {
  return getAddressArray(address)[index];
}
