# SmartRoute

react.js route-enabled component

Copyright (c) 2017 UXIP

Open source is for educational purposes only.  Commercial use is strictly prohibited.

## Summary

SmartRoute is a React component that wraps existing components to route-enable them, allowing your routing semantics to live organically within your React app.

The sum of the SmartRoutes creates a map.  The SmartRoutes communicate with eachother to activate or deactivate SmartRoutes as required.  The API is simple, providing just one method to control the entire SmartRoute map.

In the event SmartRoute is used in a React web app, SmartRoute will actively listen to any changes in the browser history and automatically set focus based on the user's history navigation.

SmartRoute has no dependancies and does not require the browser's API to function.

## Usage

### Component Declaration
To use SmartRoute, wrap your component(s) in a SmartRoute component and provide the SmartRoute component the necessary props.

#### 1. Root SmartRoute

   For the root SmartRoute component, you may include the following optional props:
   * **onFocusChange** - used to set handler triggered on every route change
      
      ```jsx
      onFocusChange={this.handler}
      ```

   * **nodeAddress** - used to name the SmartRoute
      
      ```jsx
      nodeAddress={'/node-name'}
      ```
   Please keep in mind, nodeAddress is a string, and it must begin with a forward slash - '/'.


   ```jsx
   <SmartRoute nodeAddress={'/your-root-component-name'} >
     <YourComponent  />
   <SmartRoute>
   ```
   
#### 2. SmartRoute Descendants

   For all SmartRoute descendants, the following props are required:

   * **navSvc** - used by parent and child SmartRoutes to communicate and to allow SmartRoute API calls
      ```jsx
      navSvc={this.props.navSvc}
      ```
      

   * **nodeAddress** - used to name the SmartRoute
      
      ```jsx
      nodeAddress={'/node-name'}
      ```
      
      Again, nodeAddress is a string that must begin with a forward slash - '/node' or alternatively, a string with the value of '.' to activate the node whenever the parent node is active

      ```jsx
      <SmartRoute navSvc={this.props.navSvc} nodeAddress={'/your-component-name'} >
        <YourComponent  />
      <SmartRoute>
      ```

### API

The SmartRoute API exposes the following properties - setFocus, getFocus, getRoot, and changeCount.  These properties are accessible via the navSvc prop.

changeCount is a counter that will increment every time the route is updated.

The getRoot and getFocus methods take no arguments and return the name of the root node and current address, respectively.

The setFocus method takes one argument for the requested address and updates the SmartRoute map to reflect the new address.  The address can be relative or absolute.  In the case an address may be relative with respect to the node's ancestors, the double-dot notation is used to traverse upwards through ancestors.

to sibling
```jsx
this.props.navSvc.setFocus('sibling');
```
or up to grandfather and down to uncle
```jsx
this.props.navSvc.setFocus('../../uncle');
```
or down to grandchild
```jsx
this.props.navSvc.setFocus('/child/grandchild');
```
or absolute
```jsx
this.props.navSvc.setFocus('/app/distant-ancestor/lost-cousin');
```
or to the root
```jsx
this.props.navSvc.setFocus('./');
```
