import { getAddressArray } from './get-address-array'

export function getCurrentNodeAddress(address, index) {
  const lastNode = getAddressArray(address)[index];

  return address.substring(0, address.indexOf(lastNode) + lastNode.length);
}
