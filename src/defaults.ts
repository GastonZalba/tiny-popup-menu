import { Position } from './@enums.js';
import { Options } from './tiny-popup-menu.js';

export const defaultOptions: Options = {
    position: Position.Bottom,
    className: '',
    autoClose: true,
    arrow: true,
    margin: undefined, // autocalculate later
    offset: {
        x: 0,
        y: 0
    },
    menuItems: [],
    stopClick: true,
    alignContent: 'center'
};
