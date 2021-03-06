//将<view aaa={this.state.xxx}> 转换成 <view aaa="{{xxx}}">

const t = require('babel-types');
const generate = require('babel-generator').default;
const getStyleValue = require('../utils/getStyleValue');
const buildType = require('../config').buildType;

function bindEvent(astPath) {
    replaceWithExpr(astPath, 'dispatchEvent', true);
}
function toString(node) {
    if (t.isStringLiteral(node)) return node.value;
    if (t.isMemberExpression) return `{{${generate(node).code}}}`;
}

module.exports = function(astPath) {
    let expr = astPath.node.expression;
    let attrName = astPath.parent.name.name;
    let isEventRegex =
        buildType == 'ali' || buildType == 'quick'
            ? /^(on|catch)/
            : /^(bind|catch)/;
    let isEvent = isEventRegex.test(attrName);
    if (isEvent && buildType == 'quick') {
        let n = attrName.charAt(0) === 'o' ? 2 : 5;
        astPath.parent.name.name = 'on' + attrName.slice(n).toLowerCase();
    }

    if (!isEvent) {
        astPath.traverse({
            ThisExpression(nodePath) {
                if (t.isMemberExpression(nodePath.parentPath)) {
                    nodePath.parentPath.replaceWith(
                        t.identifier(nodePath.parent.property.name)
                    );
                }
            }
        });
    }

    let attrValue = generate(expr).code;
    switch (astPath.node.expression.type) {
        case 'NumericLiteral': //11
        case 'StringLiteral': // "string"
        case 'Identifier': // kkk undefined
        case 'NullLiteral': // null
        case 'BooleanLiteral':
            if (isEvent) {
                throwEventValue(attrName, attrValue);
            }

            replaceWithExpr(astPath, attrValue);
            break;
        case 'BinaryExpression': {
            let { left, right } = astPath.node.expression;
            if (t.isStringLiteral(left) || t.isStringLiteral(right)) {
                const attrName = astPath.parentPath.node.name.name;

                if (attrName === 'class' || attrName === 'className') {
                    // 快应用的 bug
                    // class={{this.className0 + ' dynamicClassName'}} 快应用会将后者的空格吞掉
                    // 影响 class 的求值
                    let className =
                        buildType == 'quick'
                            ? `${toString(
                                astPath.node.expression.left
                            )} ${toString(astPath.node.expression.right)}`
                            : `${toString(
                                astPath.node.expression.left
                            )}${toString(astPath.node.expression.right)}`;
                    astPath.replaceWith(t.stringLiteral(className));
                    return;
                }
            }
            replaceWithExpr(astPath, attrValue.replace(/^\s*this\./, ''));
            break;
        }
        case 'LogicalExpression':
        case 'UnaryExpression':
            replaceWithExpr(astPath, attrValue.replace(/^\s*this\./, ''));
            break;
        case 'MemberExpression':
            if (isEvent) {
                bindEvent(
                    astPath,
                    attrName,
                    attrValue.replace(/^\s*this\./, '')
                );
            } else {
                replaceWithExpr(astPath, attrValue.replace(/^\s*this\./, ''));
            }
            break;
        case 'CallExpression':
            if (isEvent) {
                let match = attrValue.match(/this\.(\w+)\.bind/);
                if (match && match[1]) {
                    bindEvent(astPath, attrName, match[1]);
                } else {
                    throwEventValue(attrName, attrValue);
                }
            } else {
                if (
                    attrName === 'style' &&
                    attrValue.indexOf('React.toStyle') === 0
                ) {
                    // style={{}} 类型解析
                    let start = attrValue.indexOf('\'style');
                    let end = attrValue.lastIndexOf(')');
                    let styleID = attrValue.slice(start, end);
                    replaceWithExpr(astPath, `props[${styleID}] `);
                } else {
                    replaceWithExpr(astPath, attrValue);
                }
            }
            break;
        case 'ObjectExpression':
            if (attrName === 'style') {
                let styleValue = getStyleValue(expr);
                replaceWithExpr(astPath, styleValue, true);
            } else if (isEvent) {
                throwEventValue(attrName, attrValue);
            }
            break;
        case 'ConditionalExpression':
            replaceWithExpr(astPath, attrValue.replace(/\s*this\./, ''));
            break;
        default:
            break;
    }
};

function throwEventValue(attrName, attrValue) {
    throw `${attrName}的值必须是一个函数名，如 this.xxx 或 this.xxx.bind(this),
    但现在的值是${attrValue}`;
}

function replaceWithExpr(astPath, value, noBracket) {
    let v = noBracket ? value : '{{' + value + '}}';
    astPath.replaceWith(t.stringLiteral(v));
}
