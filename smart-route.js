/* Copyright (c) 2017 UXIP */

class SmartRoute extends React.Component {
    constructor(props) {
        super(props);

        this.getRoot = this.getRoot.bind(this);
        this.getFocus = this.getFocus.bind(this);
        this.setFocus = this.setFocus.bind(this);
        this._setTargetAddress = this._setTargetAddress.bind(this);
        this._handlePopstate = this._handlePopstate.bind(this);
        this._bindAllElements = this._bindAllElements.bind(this);
        this._unbindAllElements = this._unbindAllElements.bind(this);

        this._isMounted = false;
        this._intervalId = '';

        this.state = ({
            targetAddress: '',
            isActive: false,
            isHandling: false,
            changeCount: 0
        });
    }

    static get defaultProps() {
        return ({
            nodeAddress: '',
            navSvc: {
                _index: 0
            }
        });
    }

    componentWillMount() {
        var props = this.props;

        var nodeAddress = props.nodeAddress;
        var navSvc = props.navSvc
        var nodeIndex = navSvc._index;
        var adjIndex = (navSvc._rootAddress === '') ? nodeIndex - 1 : nodeIndex;

        if (nodeIndex !== 0 && SmartRoute._shouldRouteActivate(navSvc._targetAddress, adjIndex, nodeAddress)) {
            this.setState({
                isActive: true
            });
        } else if (nodeIndex === 0) {
            this.setState({
                isActive: true,
                targetAddress: props.initAddress || (!!window && window.location.pathname !== '/') ? Se.SmartRoute.removeTrailingSlash(window.location.pathname) : nodeAddress
            });
        }
    }

    componentDidMount() {
        var props = this.props;
        var navSvc = props.navSvc;
        var nodeIndex = navSvc._index;

        if (!!window && nodeIndex === 0) {
            this._bindAllElements();
            
            var targetAddress = this.state.targetAddress;
            window.history.pushState(SmartRoute.getAddressArray(targetAddress),
                                     SmartRoute.getRelativeAddress(targetAddress),
                                     window.location.origin + targetAddress);
        } else if (nodeIndex === SmartRoute.getAddressArray(navSvc._targetAddress).length - 1 && !!props.defaultChild) {
            this.setFocus(props.defaultChild);
        }

        this._isMounted = true;

        if (this.state.isActive) {
            UXIP.smartRoute.isAnonymous = (props.navSvc._index !== 0) ? props.isAnonymous : true;
        }
    }

    componentWillReceiveProps(nextProps) {
        var props = this.props;
        var nodeAddress = nextProps.nodeAddress;

        var navSvc = nextProps.navSvc;
        var nextTarget = navSvc._targetAddress;
        var nodeIndex = navSvc._index;

        if (nextTarget != null && nextTarget !== this.props.navSvc._targetAddress) {
            if (nodeIndex === SmartRoute.getAddressArray(nextTarget).length - 1 && !!nextProps.defaultChild) {
                this.setFocus(nextProps.defaultChild);
            } else {
                var adjIndex = (navSvc._rootAddress === '') ? nodeIndex - 1 : nodeIndex;
                this.setState({
                    isActive: SmartRoute._shouldRouteActivate(nextTarget, adjIndex, nodeAddress)
                });
            }
        }
    }

    componentDidUpdate(prevProps, prevState) {
        var state = this.state;

        if ('isHandling' in state &&                                                            // fix to avoid premature handling of 
            state.isHandling &&                                                                 // focus change
            state.isHandling === prevState.isHandling) {
            this.props.onFocusChange();

            this.setState({
                isHandling: false
            });
        }
    }

    componentWillUnmount() {
        var nodeIndex = this.props.navSvc._index;

        if (!!window && nodeIndex === 0) {
            this._unbindAllElements();
        }

        clearTimeout(this._timeoutId);

        this._isMounted = false;
    }

    getRoot() {
        var props = this.props;
        return props.navSvc._rootAddress || props.nodeAddress;
    }

    getFocus() {
        var props = this.props;
        return props.navSvc._targetAddress || this.state.targetAddress;
    }

    setFocus(reqAddress) {
        var props = this.props;
        var state = this.state;
        var navSvc = props.navSvc;
        var nodeIndex = navSvc._index;
        var rootAddress = (nodeIndex > 0) ? navSvc._rootAddress : props.nodeAddress;
        var targetAddress = navSvc._targetAddress || state.targetAddress;

        var nextAddress = (() => {
            var targetAddrArr = SmartRoute.getAddressArray(targetAddress);

            if (rootAddress === SmartRoute.getAddressArray(reqAddress)[0]) {                    // returns reqAddress as nextAddress if address is absolute
                return reqAddress;
            } else if (reqAddress === './') {                                                   // returns root node
                return rootAddress;
            }

            var adjIndex = (rootAddress === '') ? nodeIndex - 1 : nodeIndex;
            for (var i = targetAddrArr.length - 1; i > adjIndex; i--) {                         // aligns address to position of node requesting new focus
                targetAddrArr.pop();
            }

            if (reqAddress.substring(0, 2) === '..') {                                          // parses relative-to-ancestor focus
                var navAddress = '/' + reqAddress;
                for (var i = 0; i < reqAddress.length; i += 3) {
                    if (reqAddress.substring(i, i + 2) !== '..') {
                        break;
                    } else {
                        targetAddrArr.pop();
                        navAddress = navAddress.substring(3);
                    }
                }
                return SmartRoute.getAddressFromArray(targetAddrArr) + navAddress;
            } else if (reqAddress[0] === '.') {                                                 // parses self focus
                return SmartRoute.getAddressFromArray(targetAddrArr);
            } else if (reqAddress[0] !== '/') {                                                 // parses relative-to-self focus
                targetAddrArr.pop();
                return SmartRoute.getAddressFromArray(targetAddrArr) + '/' + reqAddress;
            } else {                                                                            // parses relative-to-descendant focus
                return SmartRoute.getAddressFromArray(targetAddrArr) + reqAddress;
            }
        })();

        var addrChanged = false;
        if (nodeIndex !== 0) {
            addrChanged = navSvc._setTargetAddress(nextAddress);
        } else {
            if (nextAddress === targetAddress) {                                                // escapes address change when already at root
                //props.onFocusChange();
                return addrChanged;
            }
            addrChanged = this._setTargetAddress(nextAddress);
        }

        return addrChanged;
    }

    _setTargetAddress(targetAddress, isFromPopState) {
        if (!this._isMounted) {                                                                 // _setTargetAddress may be called before root is mounted, so
            this._timeoutId = setTimeout(() => {                                                // it awaits for root to mount before setting a new target
                this._setTargetAddress(targetAddress, isFromPopState);
            }, 200);
            return;
        }

        var state = this.state;

        if (state.targetAddress === targetAddress) {                                            // route change is aborted if the route is the same
            return false;
        }

        if (!!window && !isFromPopState) {
            window.history.pushState(SmartRoute.getAddressArray(targetAddress),
                                     SmartRoute.getRelativeAddress(targetAddress),
                                     window.location.origin + targetAddress);
        }

        this.setState({
            targetAddress: targetAddress,
            isHandling: true,
            changeCount: state.changeCount + 1
        });

        return true;
    }

    _handlePopstate(e) {
        var targetAddress = window.location.pathname;
        this._setTargetAddress(targetAddress, true);
    }

    _bindAllElements() {
        window.addEventListener("popstate", this._handlePopstate);
    }

    _unbindAllElements() {
        window.removeEventListener("popstate", this._handlePopstate);
    }

    render() {
        var props = this.props;
        var state = this.state;

        if (!state.isActive && !props.inGrid) {
            return null;
        }

        var navSvc = props.navSvc;

        var childrenWithProps = React.Children.map(props.children, (child) => {
            var elementProps = {};

            var childProps = child.props;
            for (var key in childProps) {
                if (childProps.hasOwnProperty(key)) {
                    elementProps[key] = childProps[key];
                }
            }

            for (var key in props) {
                if (props.hasOwnProperty(key) &&
                    key !== 'children' &&
                    key !== 'defaultChild' &&
                    key !== 'nodeAddress' &&
                    key !== 'isDebug') {
                    elementProps[key] = props[key];
                }
            }

            var hasRoot, rootAddress, targetAddress, setTargetAddress, changeCount;
            if (navSvc._index === 0) {
                rootAddress = props.nodeAddress;
                targetAddress = state.targetAddress;
                setTargetAddress = this._setTargetAddress;
                changeCount = state.changeCount;
            } else {
                rootAddress = navSvc._rootAddress;
                targetAddress = navSvc._targetAddress;
                setTargetAddress = navSvc._setTargetAddress;
                changeCount = navSvc.changeCount;
            }

            elementProps.navSvc = {
                _index: navSvc._index + 1,
                _rootAddress: rootAddress,
                _targetAddress: targetAddress,
                _setTargetAddress: setTargetAddress,
                changeCount: changeCount,
                setFocus: this.setFocus,
                getFocus: this.getFocus,
                getRoot: this.getRoot
            };

            return React.cloneElement(child, elementProps);
        });

        return React.createElement('div', {className: 'smart-route'}, childrenWithProps);
    }

    static _shouldRouteActivate(target, nodeIndex, nodeAddress) {
        var targetAddrArr = (!Array.isArray(target)) ? SmartRoute.getAddressArray(target) : target;
        var targetNode = targetAddrArr[nodeIndex];
        var lastIndex = targetAddrArr.length - 1;
        
        return (nodeAddress === targetNode ||
                nodeAddress === '.' && (nodeIndex > lastIndex || lastIndex === 0) ||
                SmartRoute.isVariableAddress(nodeAddress) && nodeIndex <= lastIndex && targetNode !== '/new-item' && targetNode[1] !== '_');
    }

    static isVariableAddress(nodeAddress) {
        if (!nodeAddress) {
            return false;
        }

        var lBracketIndex = nodeAddress.indexOf('{');
        var rBracketIndex = nodeAddress.indexOf('}');

        return lBracketIndex === 1 && rBracketIndex !== -1;                                     // format for variable address is '/{node}', so lBracketIndex 
    }                                                                                           // will always be at index 1

    static getRelativeAddress(address) {
        address = SmartRoute.removeTrailingSlash(address);

        return address.substring(address.lastIndexOf('/'));
    }

    static getParentNodeAddress(address) {
        return address.substring(0, address.lastIndexOf('/'));
    }

    static getAncestorNodeAddress(address, index) {
        var addressArr = SmartRoute.getAddressArray(address);

        return addressArr.slice(index, index + 1)[0];
    }

    static getRootNodeAddress(address) {
        if (address.split('/').length - 1 === 1) {
            return address;
        }

        return address.substring(0, address.indexOf('/', 1));
    }

    static getAddressArray(address) {
        if (address[0] !== '/') {
            address = '/' + address;
        }

        var indices = [];
        for (var i = 0; i < address.length; i++) {
            if (address[i] === '/')
                indices.push(i);
        }

        var arr = [];
        for (var j = 0; j < indices.length; j++) {
            if (j + 1 !== indices.length)
                arr.push(address.substring(indices[j], address.indexOf('/', indices[j] + 1)));
            else
                arr.push(address.substring(indices[j]));
        }
        return arr;
    }

    static getAddressFromArray(addressArr) {
        var address = '';
        for (var i = 0; i < addressArr.length; i++) {
            address = address + addressArr[i];
        }
        return address;
    }

    static getCurrentNodeAddress(address, index) {
        var lastNode = SmartRoute.getAddressArray(address)[index];

        return address.substring(0, address.indexOf(lastNode) + lastNode.length);
    }

    static getNodeAddress(address, index) {
        return SmartRoute.getAddressArray(address)[index];
    }

    static removeLeadingSlash(address) {
        if (!!address && address[0] === '/') {
            address = address.substring(1);
        }
        return address;
    }

    static removeTrailingSlash(address) {
        if (!!address && address.substring(address.length - 1) === '/') {
            address = address.slice(0, -1);
        }
        return address;
    }
}

//export default SmartRoute;
