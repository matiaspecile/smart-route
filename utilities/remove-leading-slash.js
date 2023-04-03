export function removeLeadingSlash(address) {
  if (!!address && address[0] === '/') {
    address = address.substring(1);
  }
  return address;
}
