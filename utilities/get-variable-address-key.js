export function getVariableAddressKey(nodeAddress) {
  if (!nodeAddress) {
    return;
  }

  const lBracketIndex = nodeAddress.indexOf('{');
  const rBracketIndex = nodeAddress.indexOf('}');

  return nodeAddress.substring(lBracketIndex + 1, rBracketIndex - 1);
};
