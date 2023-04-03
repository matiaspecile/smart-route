export function getRootNodeAddress(address) {
  if (address.split('/').length - 1 === 1) {
    return address;
  }

  return address.substring(0, address.indexOf('/', 1));
}
