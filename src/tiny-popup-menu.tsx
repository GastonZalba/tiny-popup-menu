import { TinyEmitter } from 'tiny-emitter';

import myPragma from './myPragma';

import './assets/scss/tiny-popup-menu.scss';

const ID = 'popup-menu';
const CLASS_CONTAINER = ID + '--container';
const CLASS_OPEN = ID + '--active';
const CLASS_SHOW_ARROW = ID + '--show-arrow';
const CLASS_SHOW_ARROW_TOP = ID + '--show-arrow-top';
const CLASS_SHOW_ARROW_BOTTOM = ID + '--show-arrow-bottom';
const CLASS_ITEM = ID + '--item';
const CLASS_ITEM_SEPARATOR = ID + '--item-separator';

let instances = 1;

/**
 *
 * @param target
 * @param sources
 * @returns
 */
const deepObjectAssign = (target, ...sources) => {
    sources.forEach((source) => {
        Object.keys(source).forEach((key) => {
            const s_val = source[key];
            const t_val = target[key];
            target[key] =
                t_val &&
                s_val &&
                typeof t_val === 'object' &&
                typeof s_val === 'object' &&
                !Array.isArray(t_val) // Don't merge arrays
                    ? deepObjectAssign(t_val, s_val)
                    : s_val;
        });
    });
    return target;
};

/**
 * @fires open
 * @fires close
 * @fires updateposition
 */
export default class TinyPopupMenu extends TinyEmitter {
    private _isOpen = false;
    private _toggler: HTMLElement;
    private _containerMenu: HTMLElement;
    private _menuItemsList: HTMLElement[];
    private _instanceOptions: Options;
    private _options: OpenOptions;

    private _closeListener: (evt: CustomEvent) => void;
    private _resizeListener: (evt: CustomEvent) => void;

    constructor(options: Options = null) {
        super();
        this._containerMenu = <div id={`${ID}-${instances}`}></div>;
        this._instanceOptions = this._parseOptions(options);
        instances++;
    }

    /**
     * Open Menu
     * @fires open
     * @param options
     * @returns
     */
    open(options: OpenOptions): void {
        if (this._isOpen) {
            // clean menu items
            this.close();

            // if the same button is clicked, do not reopen
            if (options.event.currentTarget === this._toggler) {
                options.event.preventDefault();
                options.event.stopPropagation();
                return;
            }
        }

        this._options = this._parseOptions(options) as OpenOptions;

        const { event, menuItems, autoClose } = this._options;

        this._toggler = event.currentTarget as HTMLElement;

        this._menuItemsList = menuItems.map((item) => {
            if (item === '-') {
                return <span className={CLASS_ITEM_SEPARATOR}></span>;
            } else {
                return (
                    <div
                        className={CLASS_ITEM + ' ' + (item.className || '')}
                        onClick={
                            item.callback
                                ? (event: MouseEvent) => {
                                      item.callback(event);
                                      if (autoClose) this.close();
                                  }
                                : null
                        }
                        id={item.id}
                        style={item.style}
                    >
                        {item.content}
                    </div>
                );
            }
        });

        this._isOpen = true;

        this.updatePosition();

        this.addEventListeners();

        this.emit('open');

        event.preventDefault();
        event.stopPropagation();
    }

    /**
     * @fires close
     * Close menu
     */
    close(): void {
        this._containerMenu.innerHTML = '';
        this._containerMenu.remove();

        this._toggler.classList.remove(CLASS_OPEN);
        this._isOpen = false;
        this.removeEventListeners();
        this.emit('close');
    }

    /**
     * Update the position of an opened menu
     * @fires updateposition
     */
    updatePosition(silent = true): void {
        /**
         * Check if the default position is ok or needs to be inverted
         */
        const evaluatePosition = (): Position => {
            if (position === Position.Top) {
                if (
                    togglerPosition.top + menuHeight + offsetTop + margin <=
                    0
                ) {
                    return Position.Bottom;
                }
            } else if (position === Position.Bottom) {
                if (
                    togglerPosition.top +
                        menuHeight +
                        offsetTop +
                        togglerHeight +
                        margin >=
                    document.documentElement.scrollHeight
                ) {
                    return Position.Top;
                }
            }

            return position;
        };

        if (!this._isOpen) return;

        const { offset, className, arrow, position, margin } = this._options;

        this._containerMenu.style.position = 'fixed';
        this._containerMenu.className = className;
        this._containerMenu.classList.add(ID);

        if (arrow) {
            this._containerMenu.classList.add(CLASS_SHOW_ARROW);
        }

        this._containerMenu.innerHTML = '';
        this._containerMenu.append(
            <div className={CLASS_CONTAINER}>{...this._menuItemsList}</div>
        );

        document.body.append(this._containerMenu);

        const togglerPosition = this._toggler.getBoundingClientRect();

        const togglerHeight = this._toggler.offsetHeight;
        const togglerWidth = this._toggler.offsetWidth;

        const offsetLeft = offset?.x || 0;
        const offsetTop = offset?.y || 0;

        // Button height + menu height
        const menuHeight = this._containerMenu.offsetHeight;
        const menuWidth = this._containerMenu.offsetWidth;

        // If menu is near bottom, show upright
        const finalPosition = evaluatePosition();

        let compensateMenuHeight = 0;
        let compensateMenuWidthToCenter = 0;

        switch (finalPosition) {
            case Position.Bottom:
                compensateMenuHeight = offsetTop + togglerHeight + margin;
                compensateMenuWidthToCenter = -menuWidth / 2 + togglerWidth / 2;
                break;
            case Position.Top:
                compensateMenuHeight = -menuHeight - margin;
                compensateMenuWidthToCenter = -menuWidth / 2 + togglerWidth / 2;
                break;
        }

        const windowWidth = window.innerWidth;

        const calcualteLeft =
            togglerPosition.left + offsetLeft + compensateMenuWidthToCenter;

        let adjustX = 0;

        // it's outside the left border
        if (calcualteLeft < 0) {
            adjustX = 0 - calcualteLeft + margin;
        } else if (calcualteLeft + menuWidth > windowWidth) {
            // it's outside the right border
            adjustX = windowWidth - (calcualteLeft + menuWidth) - margin;
        }

        this._containerMenu.style.left = calcualteLeft + adjustX + 'px';
        this._containerMenu.style.top =
            togglerPosition.top + compensateMenuHeight + 'px';

        this._toggler.classList.add(CLASS_OPEN);

        if (arrow) {
            // displace X css arrow
            this._containerMenu.style.setProperty('--ofx', `${adjustX + 5}px`);
            this._evaluateArrowPosition(finalPosition);
        }

        if (!silent) {
            this.emit('updateposition');
        }
    }

    /**
     * Instead of creating onclick listeners on each toggler/button,
     * you can add these using the `addToggler` method
     *
     * @param el
     * @param options
     * @param type
     */
    addToggler(
        el: HTMLElement,
        options: Options = {},
        type: 'click' | 'contextmenu' = 'click'
    ): void {
        if (type === 'contextmenu') {
            el.addEventListener('contextmenu', (event) =>
                this.open({ ...options, event })
            );
        } else {
            el.addEventListener('click', (event) =>
                this.open({ ...options, event })
            );
        }
    }

    /**
     * Merge default options, instance options, and single open method options
     * @param options
     * @returns
     */
    protected _parseOptions(options: Options): Options | OpenOptions {
        const defaultOptions: Options = {
            position: Position.Bottom,
            className: '',
            autoClose: true,
            arrow: true,
            margin: ('arrow' in (options || {}) ? options.arrow : true)
                ? 10
                : 2,
            offset: {
                x: 0,
                y: 0
            },
            menuItems: []
        };

        return deepObjectAssign(
            {},
            defaultOptions,
            this._instanceOptions || {},
            options || {}
        );
    }

    protected _evaluateArrowPosition(position: Position) {
        let arrowPositionClass = '';

        switch (position) {
            case Position.Bottom:
                arrowPositionClass = CLASS_SHOW_ARROW_TOP;
                break;
            case Position.Top:
                arrowPositionClass = CLASS_SHOW_ARROW_BOTTOM;
                break;
        }

        this._containerMenu.classList.add(arrowPositionClass);
    }

    protected addEventListeners(): void {
        // Close if click is outside the menu
        this._closeListener = (evt: CustomEvent) => {
            if (!this._containerMenu.contains(evt.target as Node)) {
                this.close();
            }
        };

        this._resizeListener = () => {
            if (this._isOpen) {
                this.updatePosition(false);
            }
        };

        document.addEventListener('click', this._closeListener);
        window.addEventListener('resize', this._resizeListener);
    }

    protected removeEventListeners(): void {
        document.removeEventListener('click', this._closeListener);
        window.removeEventListener('resize', this._resizeListener);
    }
}

export const enum Position {
    Top = 'top',
    Bottom = 'bottom'
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
    menuItems?: Array<
        | {
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
          }
        | '-'
    >;
}

export interface OpenOptions extends Options {
    event: MouseEvent;
}
