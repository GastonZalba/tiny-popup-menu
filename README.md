# Tiny Popup Menu (beta)

Tiny vanilla javascript library to display popup menus next to button togglers.

## Example
See an online example/playground [here](https://raw.githack.com/GastonZalba/tiny-popup-menu/main/examples/basic.html).

## Usage
### Creating an instance

```js
var tinyPopupMenu = new TinyPopupMenu({
    autoclose: true,
    menuItems: [
        {
            content: 'Display alert 😎',
            callback: () => alert('Alert')
        },
        {
            content: 'Display another alert',
            callback: () => alert('Another alert')
        },
        '-', // separator
        {
            content: 'Delete',
            callback: () => alert('Delete!'),
            className: 'delete'
        }
    ]
});

// You can add the `onclick` or `oncontextmenu` listeners to each button and trigger the `open` method to it
myTogglerButton.onclick = function (event) {
    tinyPopupMenu.open(event);
};

// or add the button programatically to the instance
tinyPopupMenu.addToggler(myTogglerButton, {...customOptions}, 'click');
```

### Events
```js
tinyPopupMenu.on('open', () => console.log('Open event'));
tinyPopupMenu.on('close', () => console.log('Close event'));
tinyPopupMenu.on('updateposition', () => console.log('Update position event'));
```

## TODO
- Improve README
- Add hoverable submenu
- Add example using a scrollable div
- Themes
## License

MIT (c) Gastón Zalba.
