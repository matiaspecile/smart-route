export function removeTrailingSlash(address) {
  if (!!address && address.substring(address.length - 1) === '/') {
    address = address.slice(0, -1);
  }
  return address;
}
