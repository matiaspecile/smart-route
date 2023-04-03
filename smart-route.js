import React, { useEffect, useRef, useState } from 'react'

import { getAddressArray } from './utilities/get-address-array'
import { getAddressFromArray } from './utilities/get-address-from-array'
import { getAncestorNodeAddress } from './utilities/get-ancestor-node-address'
import { getCurrentNodeAddress } from './utilities/get-current-node-address'
import { getNodeAddress } from './utilities/get-node-address'
import { getParentNodeAddress } from './utilities/get-parent-node-address'
import { getRelativeAddress } from './utilities/get-relative-address'
import { getRootNodeAddress } from './utilities/get-root-node-address'
import { getVariableAddressKey } from './utilities/get-variable-address-key'
import { isVariableAddress } from './utilities/is-variable-address'
import { removeLeadingSlash } from './utilities/remove-leading-slash'
import { removeTrailingSlash } from './utilities/remove-trailing-slash'
import { shouldRouteActivate } from './utilities/should-route-activate'

const useComponentWillMount = (callback) => {
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) {
      return;
    }

    callback();

    mounted.current = true
  }, []);
};


function SmartRoute(props) {
  const {
    children,
    defaultChild,
    navSvc = { _index: 0 },
    nodeAddress = '',
    onMount,
    onNavSvcInit,
    ...restProps
  } = props;

  const [changeCount, setChangeCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isHandling, setIsHandling] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [targetAddress, setTargetAddress] = useState('');
  const [variableKey, setVariableKey] = useState('');
  let _timeoutId;

  function initializeSmartRoute() {
    const nodeIndex = navSvc._index;
    const adjacentIndex = (navSvc._rootAddress === '') ? nodeIndex - 1 : nodeIndex; // todo check if ever nodeIndex

    if (nodeIndex > 0 && shouldRouteActivate(navSvc._targetAddress, adjacentIndex, nodeAddress)) {
      setIsActive(true);
    } else if (nodeIndex === 0) {
      setIsActive(true);
      const pathname = window?.location.pathname;
      setTargetAddress((pathname !== '/') ? removeTrailingSlash(pathname) : nodeAddress);
    }
  };

  useComponentWillMount(() => initializeSmartRoute());

  useEffect(() => {
    const nodeIndex = navSvc._index;

    if (nodeIndex === 0) {
      _bindAllElements();

      onNavSvcInit && onNavSvcInit({
        _index: navSvc._index - 1,
        _rootAddress: nodeAddress,
        _targetAddress: targetAddress,
        _setTargetAddress: _setTargetAddress,
        changeCount: changeCount,
        setFocus: setFocus,
        getFocus: getFocus,
        getSelf: getSelf,
        getRoot: getRoot
      });
    } else if (defaultChild && nodeIndex === getAddressArray(navSvc._targetAddress).length - 1) {
      setFocus(defaultChild);
    }

    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!nodeAddress) {
      return;
    }
    setVariableKey(isVariableAddress(nodeAddress) ? getVariableAddressKey(nodeAddress) : '');
  }, [nodeAddress]);

  useEffect(() => {
    const nextTarget = navSvc._targetAddress;
    const nodeIndex = navSvc._index;

    if (nextTarget == null) {
      return;
    }

    if (nodeIndex === getAddressArray(nextTarget).length - 1 && !!defaultChild) {
      setFocus(defaultChild);
    } else {
      const adjIndex = (navSvc._rootAddress === '') ? nodeIndex - 1 : nodeIndex;
      setIsActive(shouldRouteActivate(nextTarget, adjIndex, nodeAddress));
    }
  }, [navSvc, nodeAddress]);

  useEffect(() => {
    if (isActive && navSvc._targetAddress !== targetAddress && !!onFocusChange) {
      onFocusChange(navSvc._targetAddress || targetAddress);
    }

    return () => {
      const nodeIndex = navSvc._index;

      if (!!window && nodeIndex === 0) {
        _unbindAllElements();
      }

      clearTimeout(_timeoutId);

      setIsMounted(false);
    }
  }, []);


  function getRoot() {
    return navSvc._rootAddress || nodeAddress;
  };

  function getSelf() {
    const navSvc = navSvc;
    const targetAddressArr = getAddressArray(navSvc._targetAddress || targetAddress);
    const index = (!navSvc._rootAddress) ? navSvc._index - 1 : navSvc._index;
    index -= (nodeAddress === '.') ? 1 : 0;

    return targetAddressArr[index];
  };

  function getFocus() {
    return navSvc._targetAddress || targetAddress;
  };

  function setFocus(reqAddress, isPopState) {
    reqAddress = (reqAddress === '/') ? './' : reqAddress;

    //const navSvc = navSvc || {};
    const nodeIndex = navSvc?._index;
    const rootAddress = (nodeIndex > 0) ? navSvc._rootAddress : nodeAddress;
    let targetAddress = navSvc?._targetAddress || targetAddress;

    const hashIndex = targetAddress?.indexOf('#');
    targetAddress = (hashIndex < 0) ? targetAddress : targetAddress?.substring(0, hashIndex);

    const nextAddress = (() => {
      let targetAddrArr = (!targetAddress) ? [] : getAddressArray(targetAddress);

      if (rootAddress === getAddressArray(reqAddress)[0]) {                               // returns reqAddress as nextAddress if address is absolute
        return reqAddress;
      } else if (reqAddress === './') {                                                   // returns root node
        return rootAddress;
      }

      const adjIndex = (rootAddress === '') ? nodeIndex - 1 : nodeIndex;
      for (let i = targetAddrArr.length - 1; i > adjIndex; i--) {                         // aligns address to position of node requesting new focus
        targetAddrArr.pop();
      }

      if (!reqAddress) {
        return reqAddress;
      } else if (reqAddress.substring(0, 2) === '..') {                                   // parses relative-to-ancestor focus
        let navAddress = '/' + reqAddress;
        for (let i = 0; i < reqAddress.length; i += 3) {
          if (reqAddress.substring(i, i + 2) !== '..') {
            break;
          } else {
            targetAddrArr.pop();
            navAddress = navAddress.substring(3);
          }
        }
        return getAddressFromArray(targetAddrArr) + navAddress;
      } else if (reqAddress[0] === '.') {                                                 // parses self focus
        return getAddressFromArray(targetAddrArr);
      } else if (reqAddress[0] !== '/') {                                                 // parses relative-to-self focus
        targetAddrArr.pop();
        return getAddressFromArray(targetAddrArr) + '/' + reqAddress;
      } else {                                                                            // parses relative-to-descendant focus
        return getAddressFromArray(targetAddrArr) + reqAddress;
      }
    })();


    let addrChanged = false;
    if (nodeIndex !== 0) {
      addrChanged = navSvc._setTargetAddress(nextAddress, isPopState);
    } else {
      if (nextAddress === targetAddress) {                                                // escapes address change when already at root
        return addrChanged;
      }
      addrChanged = _setTargetAddress(nextAddress, isPopState);
    }

    return addrChanged;
  };

  function _setTargetAddress(_targetAddress, isPopState) {
    if (!isMounted) {                                                                 // _setTargetAddress may be called before root is mounted, so
      _timeoutId = setTimeout((_targetAddress, isPopState) => {                       // it awaits for root to mount before setting a new target
        _setTargetAddress(_targetAddress, isPopState);
      }, 100, _targetAddress, isPopState);
      return;
    }
    if (targetAddress === _targetAddress) {                                            // route change is aborted if the route is the same
      return false;
    }

    const targetAddressArr = getAddressArray(_targetAddress);
    const relativeAddress = getRelativeAddress(_targetAddress);

    window && !isPopState &&
      window.history.pushState(
        targetAddressArr,
        relativeAddress,
        window.location.origin + _targetAddress + window.location.search);

    setTargetAddress(_targetAddress);
    setIsHandling(true);
    setChangeCount(changeCount + 1);

    return true;
  };

  function _handlePopstate(e) {
    const pathname = window.location.pathname;
    const _targetAddress = (pathname === '/') ? '' : pathname;
    _setTargetAddress(_targetAddress, true);
  };

  function _handleLayerClick(e) {
    let target = e.target || e.srcElement;
    if (target.tagName !== 'A') {
      return;
    }

    setFocus(target.href);
  };

  function _bindAllElements() {
    window.addEventListener('popstate', _handlePopstate);
  };

  function _unbindAllElements() {
    window.removeEventListener('popstate', _handlePopstate);
  };

  if (!isActive) {
    return null;
  }

  const childrenWithProps = React.Children.map(children, child => {
    if (!child) {
      return;
    }

    const nextProps = {};

    const childProps = child.props;
    for (let i = 0, keys = Object.keys(childProps); i < keys.length; i++) {
      const key = keys[i];
      nextProps[key] = childProps[key];
    }

    for (let i = 0, keys = Object.keys(restProps); i < keys.length; i++) {
      const key = keys[i];
      nextProps[key] = restProps[key];
    }

    let
      rootAddress = nodeAddress,
      nextTargetAddress = targetAddress,
      nextChangeCount = changeCount,
      targetAddressCb = _setTargetAddress;

    if (navSvc._index > 0) {
      rootAddress = navSvc._rootAddress;
      nextTargetAddress = navSvc._targetAddress;
      nextChangeCount = navSvc.changeCount;
      targetAddressCb = navSvc._setTargetAddress;
    }

    nextProps.navSvc = {
      _index: navSvc._index + 1,
      _rootAddress: rootAddress,
      _targetAddress: targetAddress,
      _setTargetAddress: targetAddressCb,
      changeCount: changeCount,
      setFocus: setFocus,
      getFocus: getFocus,
      getSelf: getSelf,
      getRoot: getRoot
    };

    return React.cloneElement(child, nextProps);
  });

  return childrenWithProps;
};

export default SmartRoute;
