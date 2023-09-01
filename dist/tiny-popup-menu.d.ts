import { TinyEmitter } from 'tiny-emitter';
import './assets/scss/tiny-popup-menu.scss';
/**
 * @fires open
 * @fires close
 * @fires updateposition
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
    constructor(options?: Options);
    /**
     * Open Menu
     * @fires open
     * @param options
     * @returns
     */
    open(options: OpenOptions): void;
    /**
     * @fires close
     * Close menu
     */
    close(): void;
    /**
     * Update the position of an opened menu
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
     * Merge default options, instance options, and single open method options
     * @param options
     * @returns
     */
    protected _parseOptions(options: Options): Options | OpenOptions;
    protected _evaluateArrowPosition(position: Position): void;
    protected addEventListeners(): void;
    protected removeEventListeners(): void;
}
export declare const enum Position {
    Top = "top",
    Bottom = "bottom"
}
export interface Options {
    /**
     * Close menu after selecting an item
     */
    autoClose?: boolean;
    /**
     *
     */
    position?: Position;
    /**
     * Margin between the menu and the toggler button
     */
    margin?: number;
    /**
     * Offset to dispaly the menu
     */
    offset?: {
        x?: number;
        y?: number;
    };
    /**
     * Classname to add to the popup menu
     */
    className?: string;
    /**
     *  Show css arrow
     */
    arrow?: boolean;
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
    /**
     * Prevent event propagation
     */
    stopClick?: boolean;
}
export interface OpenOptions extends Options {
    event: MouseEvent;
}
