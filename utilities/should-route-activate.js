import { getAddressArray } from './get-address-array'
import { isVariableAddress } from './is-variable-address';

export function shouldRouteActivate(target, nodeIndex, nodeAddress) {
  const hashIndex = target?.indexOf('#');
  target = (hashIndex < 0) ? target : target?.substring(0, hashIndex);

  const targetAddrArr = (!Array.isArray(target)) ? getAddressArray(target) : target;
  const targetNode = targetAddrArr[nodeIndex];
  const lastIndex = targetAddrArr.length - 1;

  return (nodeAddress === targetNode ||
    nodeAddress === '.' && (!target || nodeIndex > lastIndex) ||
    isVariableAddress(nodeAddress) && nodeIndex <= lastIndex && targetNode !== '/new-item' && targetNode[1] !== '_');
};
