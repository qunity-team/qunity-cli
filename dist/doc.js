"use strict";
/**
 * Created by rockyl on 2020-05-12.
 */
Object.defineProperty(exports, "__esModule", { value: true });
function getDoc(source) {
    function requireMethod(id) {
        if (id === 'qunity') {
            return {
                Doc: function () {
                    return {
                        kv: function (args) {
                            return args;
                        }
                    };
                }
            };
        }
    }
    let func = new Function('require', 'exports', source);
    let exports = {};
    func(requireMethod, exports);
    return exports.doc;
}
exports.getDoc = getDoc;
//# sourceMappingURL=doc.js.map