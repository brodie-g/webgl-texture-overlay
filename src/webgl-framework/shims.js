// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let left;
const vendors = [null, 'webkit', 'apple', 'moz', 'o', 'xv', 'ms', 'khtml', 'atsc', 'wap', 'prince', 'ah', 'hp', 'ro', 'rim', 'tc'];

const vendorName = function(name, vendor) {
    if (vendor === null) {
        return name;
    } else {
        return vendor + name[0].toUpperCase() + name.substr(1);
    }
};

const getAttribName = function(obj, name) {
    for (let vendor of Array.from(vendors)) {
        const attrib_name = vendorName(name, vendor);
        const attrib = obj[attrib_name];
        if (attrib != null) {
            return attrib_name;
        }
    }
};
   
const getAttrib = function(obj, name, def) {
    if (obj) {
        for (let vendor of Array.from(vendors)) {
            const attrib_name = vendorName(name, vendor);
            const attrib = obj[attrib_name];
            if (attrib != null) {
                return attrib;
            }
        }
    }
    return def;
};

window.performance = getAttrib(window, 'performance');

if ((window.performance == null)) {
    window.performance = {};
}

window.performance.now = getAttrib(window.performance, 'now');

if ((window.performance.now == null)) {
    const startTime = Date.now();
    window.performance.now = () => Date.now() - startTime;
}

window.requestAnimationFrame = getAttrib(window, 'requestAnimationFrame', callback => setTimeout(callback, 1000/60));

window.fullscreen = {
    enabled: (left = getAttrib(document, 'fullScreenEnabled')) != null ? left : getAttrib(document, 'fullscreenEnabled'),

    element() {
        let left1;
        return (left1 = getAttrib(document, 'fullScreenElement')) != null ? left1 : getAttrib(document, 'fullscreenElement');
    },
        
    exit() {
        let left1, left2, left3;
        const name = (
            (left1 = (left2 = (left3 = getAttribName(document, 'exitFullScreen')) != null ? left3 : getAttribName(document, 'exitFullscreen')) != null ? left2 : getAttribName(document, 'cancelFullScreen')) != null ? left1 : getAttribName(document, 'cancelFullscreen')
        );
        if (name != null) {
            return document[name]();
        }
    },

    request(element) {
        let left1;
        const name = (left1 = getAttribName(element, 'requestFullScreen')) != null ? left1 : getAttribName(element, 'requestFullscreen');
        if (name != null) {
            return element[name]();
        }
    },
            
    addEventListener(callback) {
        const onChange = function(event) {
            event.entered = (fullscreen.element() != null);
            return callback(event);
        };

        document.addEventListener('fullscreenchange', onChange);
        for (let vendor of Array.from(vendors.slice(1))) {
            document.addEventListener(vendor + 'fullscreenchange', onChange);
        }

    }
};

fullscreen.addEventListener(function(event) {
    const element = event.target;
    if (event.entered) {
        return element.className += ' fullscreen';
    } else {
        return element.className = element.className.replace(' fullscreen', '').replace('fullscreen', '');
    }
});

