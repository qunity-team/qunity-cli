/**
 * Created by rockyl on 2020-03-18.
 */

const ts = require('typescript');
const fs = require('fs');

const {
	ClassDeclaration, EnumDeclaration, ExportKeyword, DefaultKeyword,
	PropertyDeclaration, MethodDeclaration,
	TypeReference, AnyKeyword, NumberKeyword, StringKeyword, BooleanKeyword,
	NumericLiteral, StringLiteral, TrueKeyword, FalseKeyword,
	PrivateKeyword, ProtectedKeyword, StaticKeyword,
	NewExpression, PropertyAccessExpression, ObjectLiteralExpression, ArrayLiteralExpression,
} = ts.SyntaxKind;

const filterModifiers = [PrivateKeyword, ProtectedKeyword, StaticKeyword,];
const filterDecorators = ['hidden'];
const filterNamePrefix = ['_', '$'];

const typeMapping = {
	[AnyKeyword]: 'any',
	[NumberKeyword]: 'number',
	[StringKeyword]: 'string',
	[BooleanKeyword]: 'boolean',
};

const defaultTypeMapping = {
	[NumericLiteral]: 'number',
	[StringLiteral]: 'string',
	[TrueKeyword]: 'boolean',
	[FalseKeyword]: 'boolean',
};

const editorInstructs = ['if'];

const vector2Properties = ['x', 'y'];

export function generateDeclaration(scriptFile) {
	let code = fs.readFileSync(scriptFile, 'utf-8');
	console.time('parse');
	let sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.ES2015);
	console.timeEnd('parse');

	let enums = [];
	let components = [];
	let declaration;
	ts.forEachChild(sourceFile, function (node) {
		switch (node.kind) {
			case ClassDeclaration:
				if (
					node.modifiers && node.modifiers.length >= 2 &&
					node.modifiers[0].kind === ExportKeyword &&
					node.modifiers[1].kind === DefaultKeyword
				) {
					let props = [];
					let methods = [];
					declaration = {
						name: node.name.text,
						props,
						methods,
					};
					putComment(node, declaration);

					let prop;
					for (let member of node.members) {
						let name = member.name.text;
						if (filterMember(member, name)) {
							continue;
						}
						switch (member.kind) {
							case PropertyDeclaration:
								prop = getProp(member);
								putEditorTag(member, prop);
								if (prop.type && prop.type !== 'any') {
									props.push(prop);
								}
								break;
							case MethodDeclaration:
								let method = {
									name,
								};
								putComment(member, method);
								if (member.parameters && member.parameters.length > 0) {
									let parameters = method.parameters = [];
									for (let parameter of member.parameters) {
										let p = getProp(parameter);
										if (parameter.questionToken) {
											p.optional = true;
										}
										parameters.push(p);
									}
								}
								methods.push(method);
								break;
						}
					}

					components.push(declaration);
				}
				break;
			case EnumDeclaration:
				let members = [];
				declaration = {
					name: node.name.text,
					members,
				};
				putComment(node, declaration);

				for (let member of node.members) {
					let item = {
						label: member.name.text,
					};
					let defaultValue = getDefaultValue(member);
					if (defaultValue) {
						item.value = defaultValue.value;
					}
					putComment(member, item);
					members.push(item);
				}

				enums.push(declaration);
				break;
		}

		return null;
	});

	let result = {};
	if (enums.length > 0) {
		result.enums = enums;
	}
	if (components.length > 0) {
		result.components = components;
	}
	return result;
}

function filterMember(node, name) {
	let skip = false;
	for (let prefix of filterNamePrefix) {
		if (name.startsWith(prefix)) {
			skip = true;
			break;
		}
	}
	if (!skip && node.modifiers) {
		for (let modifier of node.modifiers) {
			if (filterModifiers.includes(modifier.kind)) {
				skip = true;
				break;
			}
		}
	}
	if (!skip && node.decorators && node.decorators.length > 0) {
		for (let decorator of node.decorators) {
			if (filterDecorators.includes(decorator.expression.text)) {
				skip = true;
				break;
			}
		}
	}

	return skip;
}

function getType(node) {
	if (node.type) {
		let type = node.type;
		if (type.kind === TypeReference) {
			return type.typeName.text;
		} else {
			return typeMapping[type.kind];
		}
	}
}

function getDefaultValue(node, preType) {
	if (node.initializer) {
		let value, type, init, initializer = node.initializer;
		switch (initializer.kind) {
			case NewExpression:
				switch (preType) {
					case 'Vector2':
						value = [];
						for (let i = 0, li = initializer.arguments.length; i < li; i++) {
							const argument = initializer.arguments[i];
							init = getInitializer(argument);
							value.push(init.value);
						}
						break;
				}
				break;
			case PropertyAccessExpression:
				if (initializer.expression) {
					type = initializer.expression.text;
				}
				value = node.initializer.name.text;
				break;
			case ArrayLiteralExpression: //数组暂时不识别
				//type = 'array';
				break;
			case ObjectLiteralExpression:
				switch (preType) {
					case 'vector2':
						value = {};
						for (let property of initializer.properties) {
							init = getInitializer(property.initializer);
							let field = property.name.escapedText;
							if (vector2Properties.includes(field)) {
								value[field] = init.value;
							}
						}
						break;
				}
				break;
			default:
				init = getInitializer(initializer);
				type = init.type;
				value = init.value;
		}
		let dv = {
			value,
		};
		if (type !== undefined) {
			dv.type = type;
		}
		return dv;
	}
}

function getInitializer(initializer) {
	let value, type = defaultTypeMapping[initializer.kind];
	let text = initializer.text;
	switch (initializer.kind) {
		case NumericLiteral:
			value = parseFloat(text);
			break;
		case StringLiteral:
			value = text;
			break;
		case TrueKeyword:
			value = true;
			break;
		case FalseKeyword:
			value = false;
			break;
	}

	return {type, value};
}

function getComment(node) {
	if (node.jsDoc) {
		let jsDoc = node.jsDoc[node.jsDoc.length - 1];
		return jsDoc.comment;
	}
}

function putComment(node, target) {
	let c = getComment(node);
	if (c) {
		target.comment = c;
	}
}

function putEditorTag(node, target) {
	if (node.jsDoc) {
		let jsDoc = node.jsDoc[node.jsDoc.length - 1];
		if (jsDoc.tags) {
			let instructions = {};
			for (let tag of jsDoc.tags) {
				let tagName = tag.tagName.text;
				if (editorInstructs.includes(tagName)) {
					instructions[tagName] = tag.comment;
				}
			}
			if (Object.keys(instructions).length > 0) {
				target.instructions = instructions;
			}
		}
	}
}

function getProp(node) {
	let name = node.name.text;

	let type = getType(node);
	let defaultValue = getDefaultValue(node, type);
	if (!type) {
		if (defaultValue && defaultValue.hasOwnProperty('type')) {
			type = defaultValue.type;
		} else {
			type = 'any';
		}
	}

	let prop = {
		name,
		type,
	};
	if (defaultValue && defaultValue.hasOwnProperty('value')) {
		prop.default = defaultValue.value;
	}
	putComment(node, prop);
	return prop;
}
