/**
 * InnerDialogStore Object - Array with other functions
 */
(function () {
    // 'use strict';
    InnerDialogStore = new (new Class({
        Extends: Array, // this is a subclass of Array to use every method of it
        closeLast: function () {
            var dialog = this.getLast();
            if (dialog !== null) {
                dialog.close();
            }
        },
        count: function () {
            return (this.length === 'undefined') ? 0 : this.length;
        },
        closeAll: function () {
            while (this.count() > 0) {
                this.closeLast();
            }
        }
    }));

    /**
     * InnerDialog Class
     */
    InnerDialog = new Class({
        Implements: [Options, Events],
        options: {
            cssClass: 'InnerDialog',
            title: '',
            url: '',
            closeText: '[Close]',
            closeAlsoDestroy: true,
            useMask: true,
            spinnerMessage: 'please wait, the content is loading...',
            width: '600px',
            minwidth: '350px',
            position: {
                position: 'center'
            },
            allowDrag: true,
            zIndex: 20,
            closeOnEscape: false, // when this option set to true in a form results in a real pain since the user uses ESC to interact with common controls
            closeOnClickMask: false,
            requestOptions: {evalScripts: true}
        },
        /*
        // events
        onOpen: function () {},
        onClose: function () {},
        onInitialize: function () {},
        onContentChange: function (content) {},
        onFailure: function (wrapper) {},
        */

        dialog: null,
        maskObject: null,

        initialize: function (options) {
            // configure options (define min-width if width defined but min-width)
            if (options.minwidth === null && options.width !== null) {
                options.minwidth = options.width;
            }
            // options.closeOnEscape = !!options.closeOnEscape;
            // options.useMask = !!options.useMask;
            this.setOptions(options);
            this.options.inject = this.options.inject || document.body;
            // create mask
            if (this.options.useMask) {
                this.createMaskObject();
            }

            var caption = new Element('div', {'class': 'InnerDialogCaption'}).adopt(
                new Element('span', {'class': 'InnerDialogTitle', 'html': this.options.title})
            );
            this.body = new Element('div', {'class': 'InnerDialogBody'});

            // create html elements
            this.dialog = new Element('div', {
                'class': this.options.cssClass,
                styles: {'z-index': this.options.zIndex}
            }).adopt([
                caption, this.body
            ]).inject(this.options.inject);


            // configure dialog
            if (this.options.width !== null) {
                this.dialog.setStyle('width', (!isNaN(this.options.width)) ? this.options.width + 'px' : this.options.width);
            }
            if (this.options.minwidth !== null) {
                this.dialog.setStyle('min-width', (!isNaN(this.options.minwidth)) ? this.options.minwidth + 'px' : this.options.minwidth);
            }

            // set close button
            if (this.options.closeText) {
                new Element('a.InnerDialogClose', {
                    'href': '#',
                    'html': this.options.closeText,
                    'events': {
                        'click': function () {
                            this.close();
                            return false;
                        }.bind(this)
                    }
                }).inject(caption);
            }

            // set drag and move capability
            if (this.options.allowDrag) {
                new Drag.Move(this.dialog, {
                    'container': this.options.inject,
                    'handle': caption
                });
            }

            // close on escape
            if (this.options.closeOnEscape) {
                document.addEvent('keyup', this.escapeCapture.bind(this));
            }

            // fire event
            this.fireEvent('initialize');
            return this;
        },

        createMaskObject: function () {
            this.maskObject = new Mask(document.body, {
                hideOnClick: false,
                destroyOnHide: false,
                'class': this.options.cssClass + '-mask',
                'style': {
                    'z-index': this.options.zIndex - 1
                }
            });
            if (this.options.closeOnEscape || this.options.closeOnClickMask) {
                this.maskObject.addEvent('click', function () {
                    this.close();
                }.bind(this));
            }
        },

        escapeCapture: function (event) {
            if (this.dialog !== null && event.code === 27) {
                this.close();
            }
        },

        Request: function () {
            // open the dialog
            this.open();
            // override the URL for requestOptions
            var requestOptions = this.options.requestOptions;
            requestOptions.url = this.options.url; // to the url specified
            requestOptions.onSuccess = function (text) {
                this.setContent(text);
            }.bind(this);
            requestOptions.onFailure = function (xhr) {
                this.fireEvent('failure', xhr);
            }.bind(this);
            // configure spinner
            if (this.options.spinnerMessage) {
                requestOptions.useSpinner = true;
                requestOptions.spinnerOptions = {message: this.options.spinnerMessage};
                requestOptions.spinnerTarget = this.body;
            }
            // do the ajax call (non async)
            new Request(requestOptions).send();
            return this;
        },

        setContent: function () {
            // clear content
            this.body.empty();
            // process arguments
            var content = Array.from(arguments);
            if (content.length === 1) {
                content = content[0];
            }
            // populate body
            if (instanceOf(content, Element) || instanceOf(content, Elements)
                || instanceOf(content, Array) || (typeof content) === 'object') {
                // populate the body with an Element or an Array of Elements
                this.body.adopt(content);
            } else {
                // populate with the text representation of content
                this.body.set('html', String(content));
            }
            // fire event
            this.fireEvent('contentChange', this.body);
            return this;
        },

        getContents: function () {
            return this.body.getChildren();
        },

        isOpen: function () {
            return this.dialog.isDisplayed();
        },

        open: function () {
            // do not close or fire the event if it's already destroyed
            if (this.dialog === null) {
                return this;
            }
            if (this.maskObject !== null) {
                this.maskObject.show();
            }
            this.dialog.show();
            if (instanceOf(this.options.position, Object)) {
                this.dialog.position(this.options.position);
            } else {
                this.dialog.position({position: 'center'});
            }
            InnerDialogStore.include(this);
            // the event should be fired AFTER the dialog was included in the InnerDialogStore
            this.fireEvent('open');
            return this;
        },

        close: function () {
            // do not close or fire the event if it's already destroyed
            if (this.dialog === null) {
                return this;
            }
            // closing routine...
            this.dialog.hide();
            if (this.maskObject !== null) {
                this.maskObject.hide();
            }
            if (this.options.closeAlsoDestroy) {
                this.destroy();
            }
            InnerDialogStore.erase(this);
            // the event should be fired AFTER the dialog was removed from the InnerDialogStore
            this.fireEvent('close');
            return this;
        },

        destroy: function () {
            if (this.body !== null) {
                this.body.destroy();
                this.body = null; // gc
            }
            if (this.maskObject !== null) {
                this.maskObject.destroy();
                this.maskObject = null; // gc
            }
            if (this.dialog !== null) {
                this.dialog.destroy();
                this.dialog = null;  // gc
            }
        },

        toElement: function () {
            return this.dialog;
        }


    });
})();

