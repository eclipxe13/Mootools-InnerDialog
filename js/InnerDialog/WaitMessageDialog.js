/*
 * WaitMessageDialog helper class
 * This class is a helper implementation if dialogs for show short messages
 */

(function () {
    // 'use strict';
    WaitMessageDialog = new Class({
        Implements: [Options],
        options: {
            title: '',
            width: 400,
            height: null,
            defaultSpinner: 'spinner.gif',
            defaultCloseText: 'Ok'
        },
        initialize: function (options) {
            this.setOptions(options);
            this.dialog = new InnerDialog({
                title: this.options.title,
                width: this.options.width,
                height: this.options.height,
                allowDrag: false,
                closeOnEscape: false,
                closeAlsoDestroy: false
            });
        },
        setMessage: function (message, closeText, autoClose) {
            if (!instanceOf(closeText, String)) {
                closeText = null;
            }
            autoClose = (isNaN(autoClose) ? 0 : autoClose.toInt());
            var contents = [],
                closeFunction = function () {
                    this.close();
                };
            if (instanceOf(message, Element)) {
                contents.push(message);
            } else {
                contents.push(new Element('p', {text: message.toString()}));
            }
            if (closeText !== null) {
                contents.push(new Element('p', {'class': 'buttons-bar'}).adopt(
                    new Element('button', {
                        'text': closeText,
                        'type': 'button',
                        'events': {
                            click: function () {
                                this.close();
                            }.bind(this.dialog)
                        }
                    })
                ));
            }
            if (autoClose > 0) {
                closeFunction.delay(autoClose * 1000, this.dialog);
            }
            this.dialog.setContent(contents);
            // if not shown show the dialog
            if (!this.dialog.isOpen()) {
                this.dialog.open();
            }
            this.dialog.dialog.position(); // center the dialog again
        },
        ulFromArray: function (texts, title) {
            var ul = new Element('ul', {text: title}), i;
            if (instanceOf(texts, Array)) {
                for (i = 0; i < texts.length; i = i + 1) {
                    new Element('li', {text: texts[i]}).inject(ul);
                }
            }
            return ul;
        },
        pSpinner: function (imgSource, text) {
            return new Element('p', {styles: {'text-align': 'left'}}).adopt([
                new Element('img', {
                    'src': imgSource,
                    'styles': {'vertical-align': 'middle'}
                }),
                new Element('span', {
                    'text': text,
                    'styles': {'margin-left': '1em'}
                })
            ]);
        },
        showSpinner: function (text) {
            this.setMessage(this.pSpinner(this.options.defaultSpinner, text));
        },
        showSuccess: function (text, autoClose) {
            this.setMessage(text, this.options.defaultCloseText, autoClose);
        },
        showErrors: function (text, errors) {
            this.setMessage(this.ulFromArray(errors, text), this.options.defaultCloseText, 0);
        },
        close: function () {
            if (this.dialog.isOpen()) {
                this.dialog.close();
            }
        },
        destroy: function () {
            this.dialog.destroy();
        }
    });
})();