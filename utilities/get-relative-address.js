import { removeTrailingSlash } from './remove-trailing-slash'

export function getRelativeAddress(address) {
  address = removeTrailingSlash(address);

  return address.substring(address.lastIndexOf('/'));
}
