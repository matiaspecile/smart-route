export function getAddressArray(address) {
  if (!address) {
    return [];
  }

  if (address[0] !== '/') {
    address = '/' + address;
  }

  const indices = [];
  for (var i = 0; i < address.length; i++) {
    if (address[i] === '/')
      indices.push(i);
  }

  const arr = [];
  for (var j = 0; j < indices.length; j++) {
    if (j + 1 !== indices.length)
      arr.push(address.substring(indices[j], address.indexOf('/', indices[j] + 1)));
    else
      arr.push(address.substring(indices[j]));
  }
  return arr;
}
