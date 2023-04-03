import { getAddressArray } from './get-address-array'

export function getAncestorNodeAddress(address, index) {
  const addressArr = getAddressArray(address);

  return addressArr.slice(index, index + 1)[0];
}
