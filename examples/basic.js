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

    // use here options shared across all elements
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
        createTestBtn('Click', (event) => tinyPopupMenu.open({ event })),
        createTestBtn('Click (custom elements)', (event) =>
            tinyPopupMenu.open({
                event,
                menuItems: [
                    {
                        content: 'Custom element'
                    },
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
    buttonsMiddle.append(
        createTestBtn('Click (no arrow)', (event) =>
            tinyPopupMenu.open({ arrow: false, event })
        ),
        createTestBtn(
            'Click (force at top)',
            (event) => tinyPopupMenu.open({ position: 'top', event }),
        ),
        createTestBtn('Use right click', (event) =>
            tinyPopupMenu.open({ position: 'bottom', event }),
            'contextmenu'
        ),
        createTestBtn('Click (no arrow)', (event) =>
            tinyPopupMenu.open({ arrow: false, event })
        )
    );

    var buttonsBottom = document.getElementById('testButtonsBottom');
    buttonsBottom.append(
        createTestBtn('Click', (event) => tinyPopupMenu.open({ event })),
        createTestBtn('Click', (event) => tinyPopupMenu.open({ event })),
        createTestBtn('Click', (event) => tinyPopupMenu.open({ event }))
    );
})();
