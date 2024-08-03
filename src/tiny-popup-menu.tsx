import { TinyEmitter } from 'tiny-emitter';

import myPragma from './myPragma';

import './assets/scss/tiny-popup-menu.scss';
import { defaultOptions } from './defaults.js';
import { Position, SubmenuPosition } from './@enums.js';

import arrowLeft from './assets/svg/arrow_left.svg';
import arrowRight from './assets/svg/arrow_right.svg';

const ID = 'popup-menu';
const CLASS_CONTAINER = ID + '--container';
const CLASS_OPEN = ID + '--active';
const CLASS_SHOW_ARROW = ID + '--show-arrow';
const CLASS_SHOW_ARROW_TOP = ID + '--show-arrow-top';
const CLASS_SHOW_ARROW_BOTTOM = ID + '--show-arrow-bottom';
const CLASS_ITEM = ID + '--item';
const CLASS_SUBMENU = ID + '--submenu';
const CLASS_SUBMENU_ARROW = ID + '--submenu-arrow';
const CLASS_SUBMENU_CONTENT = ID + '--submenu-content';
const CLASS_ITEM_SEPARATOR = ID + '--item-separator';

// Count the running instances to add a unique id at each one
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
    private _isOpen = false;
    private _toggler: HTMLElement;
    private _containerMenu: HTMLElement;
    private _menuItemsList: HTMLElement[];
    private _instanceOptions: Options;
    private _options: OpenOptions;

    private _closeListener: (evt: CustomEvent) => void;
    private _resizeListener: (evt: CustomEvent) => void;
    private _scrollListener: (evt: CustomEvent) => void;

    constructor(options: Options = null) {
        super();
        this._containerMenu = <div id={`${ID}-${instances}`}></div>;
        this._instanceOptions = options;
        instances++;
    }

    /**
     * Open Menu
     * @fires open
     * @param options
     * @returns
     */
    public open(options: OpenOptions): void {
        this._options = this._parseOptions(options) as OpenOptions;

        if (this.isOpen()) {
            // clean menu items
            this.close();

            // if the same button is clicked, do not reopen
            if (options.event.currentTarget === this._toggler) {
                if (this._options.stopClick) {
                    options.event.preventDefault();
                    options.event.stopPropagation();
                }
                return;
            }
        }

        const { event, menuItems, autoClose, stopClick } = this._options;

        this._toggler = event.currentTarget as HTMLElement;

        let hasSubmenu = false;

        this._menuItemsList = menuItems.map((item) => {
            if (item === '-') {
                return <span className={CLASS_ITEM_SEPARATOR}></span>;
            } else if ('items' in item) {
                hasSubmenu = true;
                return this._processSubMenu(item, autoClose);
            } else {
                return this._processMenuItem(item, autoClose);
            }
        });

        this._isOpen = true;

        this.updatePosition();

        if (hasSubmenu) {
            this._updateSubmenusPosition();
        }

        // delay to prevent click be fired inmediatly if `stopClick` is false
        setTimeout(() => {
            this.addEventListeners();
        });

        this.emit('open');

        if (stopClick) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    /**
     * Close menu
     *
     * @fires close
     */
    public close(): void {
        if (!this.isOpen()) return;

        this._containerMenu.innerHTML = '';
        this._containerMenu.remove();

        this._toggler.classList.remove(CLASS_OPEN);
        this.removeEventListeners();
        this._isOpen = false;
        this.emit('close');
    }

    /**
     * Update the position of an opened menu
     *
     * @fires updateposition
     */
    public updatePosition(silent = true): void {
        /**
         * Check if the default position is ok or needs to be inverted
         */
        const evaluatePosition = (): PositionType => {
            if (position === Position.Top) {
                if (
                    togglerPosition.top - menuHeight - offsetTop - margin <=
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
                    document.documentElement.offsetHeight
                ) {
                    return Position.Top;
                }
            }

            return position;
        };

        if (!this.isOpen()) return;

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

        // If menu is near a window limit, invert the direction
        const finalPosition = evaluatePosition();

        let compensateMenuHeight = 0;

        switch (finalPosition) {
            case Position.Bottom:
                compensateMenuHeight = offsetTop + togglerHeight + margin;
                break;
            case Position.Top:
                compensateMenuHeight = -menuHeight - margin;
                break;
        }

        const compensateMenuWidthToCenter = -menuWidth / 2 + togglerWidth / 2;

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
            const arrowWidth = 8;
            const extraMargin = 3;
            if (adjustX > 0) {
                // Prevent the arrow go outside the menu width
                adjustX = Math.min(
                    menuWidth / 2 - arrowWidth - extraMargin,
                    adjustX
                );
            } else {
                adjustX = Math.max(
                    -(menuWidth / 2 - (arrowWidth + extraMargin) * 2),
                    adjustX
                );
            }

            // displace X css arrow
            this._containerMenu.style.setProperty(
                '--ofx',
                `${adjustX + arrowWidth}px`
            );
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
    public addToggler(
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
     * Retunrs true if the insatance has an open menu
     *
     * @returns
     */
    public isOpen(): boolean {
        return this._isOpen;
    }

    /**
     * Merge default options, instance options, and single open method options
     * @param options
     * @returns
     */
    protected _parseOptions(options: Options): Options | OpenOptions {
        const mergedOptions = deepObjectAssign(
            {},
            defaultOptions,
            this._instanceOptions || {},
            options || {}
        );

        // if margin is not setled, add a default ones
        if (mergedOptions.margin === undefined) {
            mergedOptions.margin = (
                'arrow' in mergedOptions ? mergedOptions.arrow : true
            )
                ? 10
                : 2;
        }

        return mergedOptions;
    }

    /**
     *
     * @param submenu
     * @param autoClose
     */
    protected _processSubMenu(
        submenu: Submenu,
        autoClose: boolean
    ): HTMLElement {
        return (
            <div
                className={CLASS_SUBMENU + ' ' + (submenu.className || '')}
                id={submenu.id}
                style={submenu.style}
                data-position={submenu.position || SubmenuPosition.Right}
            >
                <span>{submenu.content}</span>
                <div className={CLASS_SUBMENU_ARROW}></div>
                <div className={CLASS_SUBMENU_CONTENT}>
                    {submenu.items.map((item) =>
                        this._processMenuItem(item, autoClose)
                    )}
                </div>
            </div>
        );
    }

    /**
     *
     * @param item
     * @param autoClose
     */
    protected _processMenuItem(
        item: MenuItem,
        autoClose: boolean
    ): HTMLElement {
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

    /**
     *
     */
    protected _updateSubmenusPosition() {
        const submenus = this._containerMenu.querySelectorAll<HTMLElement>(
            '.' + CLASS_SUBMENU
        );

        submenus.forEach((submenu) => {
            const position = submenu.dataset.position as SubmenuPosition;
            const submenuContent = submenu.querySelector<HTMLElement>(
                '.' + CLASS_SUBMENU_CONTENT
            );

            const submenuPosition = submenuContent.getBoundingClientRect();
            const submenuWidth = submenuContent.offsetWidth;

            /**
             * Check if the default position is ok or needs to be inverted
             */
            const evaluatePosition = (): SubmenuPosition => {
                if (position === SubmenuPosition.Left) {
                    if (submenuPosition.right - submenuWidth <= 0) {
                        return SubmenuPosition.Right;
                    }
                } else if (position === SubmenuPosition.Right) {
                    if (
                        submenuPosition.right + submenuWidth >=
                        document.documentElement.offsetWidth
                    ) {
                        return SubmenuPosition.Left;
                    }
                }

                return position;
            };

            const calculatedPosition = evaluatePosition();
            submenu.classList.add(CLASS_SUBMENU + '-' + calculatedPosition);

            // add arrow indicator
            const submenuArrow = submenu.querySelector<HTMLElement>(
                '.' + CLASS_SUBMENU_ARROW
            );
            submenuArrow.innerHTML = '';

            if (calculatedPosition === SubmenuPosition.Left) {
                submenuArrow.append(arrowLeft());
            } else if (position === SubmenuPosition.Right) {
                submenuArrow.append(arrowRight());
            }
        });
    }

    protected _evaluateArrowPosition(position: PositionType) {
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
            if (this.isOpen()) {
                this.updatePosition(false);
            }
        };

        this._scrollListener = (evt) => {
            if (
                this.isOpen() &&
                (evt.target as HTMLElement).contains(this._toggler)
            ) {
                this.updatePosition(false);
            }
        };

        document.addEventListener('click', this._closeListener);
        window.addEventListener('resize', this._resizeListener);
        window.addEventListener('scroll', this._scrollListener, true);
    }

    protected removeEventListeners(): void {
        document.removeEventListener('click', this._closeListener);
        window.removeEventListener('resize', this._resizeListener);
        window.removeEventListener('scroll', this._scrollListener);
    }
}

export * from './@enums.js';

/**
 * Helper function to automaticaly add a separator between an array of sections
 * @param sections
 * @returns
 */
export function addSeparator(sections: Array<MenuItem | Submenu>[]) {
    const separator = '-' as const;

    return sections.reduce((acc, val) => {
        return acc.length ? [...acc, separator, ...val] : [...acc, ...val];
    }, []);
}

/**
 * **_[interface]_**
 */
export interface OpenOptions extends Options {
    event: MouseEvent;
}

/**
 * **_[interface]_**
 */
export interface Submenu {
    content: string | HTMLElement;
    items: MenuItem[];
    /**
     * Default is right
     */
    position?: SubmenuPosition;
    id?: string;
    className?: string;
    style?: string;
}

/**
 * **_[interface]_**
 */
export interface MenuItem {
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

type PositionType = `${Position}`;

/**
 * **_[interface]_**
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
    position?: PositionType;

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
    menuItems?: Array<MenuItem | Submenu | '-'>;
}
