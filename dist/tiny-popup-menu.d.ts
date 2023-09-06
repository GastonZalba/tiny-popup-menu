import { TinyEmitter } from 'tiny-emitter';
import './assets/scss/tiny-popup-menu.scss';
/**
 * Tiny vanilla javascript library to display popup menus next to button togglers.
 *
 * The popup menu uses a fixed position calculated by javascript, allowing the toggler to be inside of scrollables elements, auto adjust margins, evaluate the position (to be on top or at the bottom of the toggler), etc.
 *
 * If you want only one menu open at a time, use one instance. Instead if you want multiples menus opened at the same time, create multiples instances.
 *
 * @fires open
 * @fires close
 * @fires updateposition
 * @extends TinyEmitter
 */
export default class TinyPopupMenu extends TinyEmitter {
    private _isOpen;
    private _toggler;
    private _containerMenu;
    private _menuItemsList;
    private _instanceOptions;
    private _options;
    private _closeListener;
    private _resizeListener;
    private _scrollListener;
    constructor(options?: Options);
    /**
     * Open Menu
     * @fires open
     * @param options
     * @returns
     */
    open(options: OpenOptions): void;
    /**
     * Close menu
     *
     * @fires close
     */
    close(): void;
    /**
     * Update the position of an opened menu
     *
     * @fires updateposition
     */
    updatePosition(silent?: boolean): void;
    /**
     * Instead of creating onclick listeners on each toggler/button,
     * you can add these using the `addToggler` method
     *
     * @param el
     * @param options
     * @param type
     */
    addToggler(el: HTMLElement, options?: Options, type?: 'click' | 'contextmenu'): void;
    /**
     * Retunrs true if the insatance has an open menu
     *
     * @returns
     */
    isOpen(): boolean;
    /**
     * Merge default options, instance options, and single open method options
     * @param options
     * @returns
     */
    protected _parseOptions(options: Options): Options | OpenOptions;
    protected _evaluateArrowPosition(position: Position): void;
    protected addEventListeners(): void;
    protected removeEventListeners(): void;
}
/**
 * Available menu positions
 */
export declare enum Position {
    Top = "top",
    Bottom = "bottom"
}
/**
 *
 */
export interface OpenOptions extends Options {
    event: MouseEvent;
}
/**
 *
 */
export interface Options {
    /**
     * Close menu after selecting an item
     * Defaults is true;
     */
    autoClose?: boolean;
    /**
     * Show the menu at top or at bottom of the toggler
     * Default is 'bottom'
     */
    position?: Position;
    /**
     * Margin between the menu and the toggler button.
     * Default is 10 if `arrow` is true, otherwise is 2
     */
    margin?: number;
    /**
     * Offset to display the menu
     */
    offset?: {
        x?: number;
        y?: number;
    };
    /**
     * Custom classname to add to the popup menu
     */
    className?: string;
    /**
     * Show css arrow
     * Default is `true`
     */
    arrow?: boolean;
    /**
     * Prevent event propagation
     * Default is `true`
     */
    stopClick?: boolean;
    /**
     * Menu items to display in the menu
     */
    menuItems?: Array<{
        content?: string | HTMLElement;
        id?: string;
        className?: string;
        style?: string;
        dataset?: any;
        /**
         * Function called when an item is clicked
         * @returns
         */
        callback?: (evt: MouseEvent) => void;
    } | '-'>;
}
