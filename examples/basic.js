(function () {
    // Add test buttons
    function createTestBtn(name, onClick, isContextMenu = false) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.innerHTML = name;
        if (isContextMenu) btn.oncontextmenu = onClick;
        else btn.onclick = onClick;
        return btn;
    }

    var checkboxInput = document.createElement('input');
    checkboxInput.type = 'checkbox';
    checkboxInput.checkd = true;

    var checkboxLabel = document.createElement('label');    
    checkboxLabel.innerText = 'Test checkbox ';
    checkboxLabel.append(checkboxInput)


    // use here options shared across all elements
    var tinyPopupMenu = new TinyPopupMenu({
        autoClose: true,
        menuItems: [
            {
                content: 'Click to display alert 😎',
                callback: () => alert('Alert')
            },
            {
                content: 'Click to display another alert',
                callback: () => alert('Another alert')
            },
            '-',
            {
                content: checkboxLabel,
                autoClose: false,
                className: 'custom-padding',
                callback: null
            },
            '-',
            {
                content: 'Submenu',
                items: [
                    {
                        content: 'Submenu item',
                        callback: () => alert('Submenu item')
                    },
                    {
                        content: 'Submenu item 2',
                        callback: () => alert('Submenu item 2')
                    }
                ]
            },
            '-',
            {
                content: 'Delete',
                callback: () => alert('Delete!'),
                className: 'delete'
            }
        ]
    });

    // Events
    tinyPopupMenu.on('open', () => console.log('Open event'));
    tinyPopupMenu.on('close', () => console.log('Close event'));
    tinyPopupMenu.on('updateposition', () =>
        console.log('Update position event')
    );

    var buttonsTop = document.getElementById('testButtonsTop');
    buttonsTop.append(
        createTestBtn('Click', (event) =>
            tinyPopupMenu.open({ position: TinyPopupMenu.Position.Top, event })
        ),
        createTestBtn('Show custom elements in same instance', (event) =>
            tinyPopupMenu.open({
                event,
                menuItems: [
                    {
                        content: 'Custom element'
                    },
                    '-',
                    {
                        content: 'Submenu to the left',
                        position: TinyPopupMenu.SubmenuPosition.Left,
                        items: [
                            {
                                content: 'Submenu item',
                                callback: () => alert('Submenu item')
                            },
                            {
                                content: 'Submenu item 2',
                                callback: () => alert('Submenu item 2')
                            }
                        ]
                    },
                    '-',
                    {
                        content: 'Custom disabled element',
                        className: 'disabled'
                    }
                ]
            })
        ),
        createTestBtn('Click', (event) => tinyPopupMenu.open({ event }))
    );

    var buttonsMiddle = document.getElementById('testButtonsMiddle');
    var btnInit = createTestBtn('Click', (event) =>
        tinyPopupMenu.open({ position: TinyPopupMenu.Position.Top, event })
    );

    buttonsMiddle.append(
        createTestBtn('Click (no arrow)', (event) =>
            tinyPopupMenu.open({ arrow: false, event })
        ),
        btnInit,
        createTestBtn(
            'Use right click',
            (event) =>
                tinyPopupMenu.open({
                    position: TinyPopupMenu.Position.Bottom,
                    event
                }),
            'contextmenu'
        ),
        createTestBtn('Click (no arrow)', (event) =>
            tinyPopupMenu.open({ arrow: false, event })
        )
    );

    var buttonsBottom = document.querySelector(
        '#testButtonsBottom .containerButtons'
    );
    buttonsBottom.append(
        createTestBtn('Click', (event) => tinyPopupMenu.open({ event })),
        createTestBtn('Click', (event) => tinyPopupMenu.open({ event })),
        createTestBtn('Click', (event) => tinyPopupMenu.open({ event }))
    );

    btnInit.click();
})();
