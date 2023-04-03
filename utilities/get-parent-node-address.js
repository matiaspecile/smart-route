export function getParentNodeAddress(address) {
  return address.substring(0, address.lastIndexOf('/'));
}
