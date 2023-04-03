export function isVariableAddress(nodeAddress) {
  if (!nodeAddress) {
    return false;
  }

  const lBracketIndex = nodeAddress.indexOf('{');
  const rBracketIndex = nodeAddress.indexOf('}');

  return lBracketIndex === 1 && rBracketIndex !== -1;                                     // format for variable address is '/{node}', so lBracketIndex
};
