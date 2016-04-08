function curry(fn) {
    return function () {
        if (fn.length > arguments.length) {
            var slice = Array.prototype.slice;
            var args = slice.apply(arguments);
            return function () {
                return fn.apply(null, args.concat(slice.apply(arguments)));
            };
        }
        return fn.apply(null, arguments);
    };
}

function updateElement(id) {
    var element = document.getElementById(id);
    if (element === null) {
        return function() {};
    }
    return function (text) {
        element.textContent = text;
    }
}