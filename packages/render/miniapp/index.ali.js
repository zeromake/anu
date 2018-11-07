import { Children } from 'react-core/Children';
import { PropTypes } from 'react-core/PropTypes';
import { Component } from 'react-core/Component';
import { PureComponent } from 'react-core/PureComponent';
import { createPortal } from 'react-core/createPortal';
import {
    createElement,
    cloneElement,
    isValidElement,
    createFactory
} from 'react-core/createElement';
import { Fragment, getWindow, miniCreateClass } from 'react-core/util';

import { injectAPIs } from './api';
import { aliApis } from './api.ali';

import { eventSystem } from './eventSystem';
import { Renderer, getCurrentPage } from './wxRender';
import { toStyle } from './toStyle';
import { toRenderProps, _getCurrentPages, useComponent } from './utils';

import { registerComponent } from './registerComponentAli';
import { registerPage } from './registerPageWx';


let { render } = Renderer;

let React =  getWindow().React = {
    //平台相关API
    eventSystem,

    findDOMNode: function() {
        console.log("小程序不支持findDOMNode"); /* eslint-disable-line */
    },
    //fiber底层API
    version: 'VERSION',
    render: render,
    hydrate: render,
    
    Fragment,
    PropTypes,
    Children,
    Component,
    createPortal,
    createElement,
    createFactory,
    cloneElement,
    PureComponent,
    isValidElement,
   
    toClass: miniCreateClass,
    toRenderProps,
    useComponent,
    getCurrentPage,
    getCurrentPages: _getCurrentPages,
    registerComponent,
    registerPage,
    toStyle,
    appType: 'ali'
};
let apiContainer = {};
if (typeof my != 'undefined') {
    apiContainer = my;//eslint-disable-line
}
injectAPIs(React, apiContainer, aliApis);

export default React;
export { Children, createElement, Component };