/**
 * @typedef {Record<string, any> | boolean} JSONSchema
 * A JSON Schema node — can be an object schema or a boolean schema.
 */

/**
 * @typedef {Object} ProcessContext
 * @property {JSONSchema} [rootSchema] - The root schema being processed.
 * @property {string[]} [path] - Path segments from the root to the current node.
 * @property {Record<string, any>} [meta] - Arbitrary metadata shared across recursion.
 */

/**
 * @typedef {Object} SchemaVisitor
 * @property {(schema: JSONSchema, context?: ProcessContext) => JSONSchema | void} [schema]
 * @property {(obj: JSONSchema, context?: ProcessContext) => JSONSchema | void} [object]
 * @property {(arr: JSONSchema[], context?: ProcessContext) => void} [array]
 */

/**
 * Recursively processes a JSON Schema using the visitor pattern.
 * @param {SchemaVisitor} visitor - Visitor functions to apply.
 * @param {JSONSchema} json - JSON Schema to process.
 * @param {ProcessContext} [context] - Optional shared context passed through recursion.
 * @returns {JSONSchema} - The processed JSON Schema.
 */
const NESTED_WITH_NAME = ["definitions", "properties"];
const NESTED_DIRECT = ["items", "additionalProperties", "not"];
const NESTED_ARRAY = ["oneOf", "anyOf", "allOf"];

const processSchema = (visitor, json, context) => {
	if (!json || typeof json !== "object") return json; // safety check

	json = { ...json };
	if (typeof visitor?.schema === "function") {
		json = visitor.schema(json, context) || json;
	}

	for (const name of NESTED_WITH_NAME) {
		if (json[name] && typeof json[name] === "object" && !Array.isArray(json[name])) {
			if (typeof visitor?.object === "function") {
				json[name] = visitor.object(json[name], context) || json[name];
			}
			for (const key of Object.keys(json[name])) {
				json[name][key] = processSchema(visitor, json[name][key], context);
			}
		}
	}

	for (const name of NESTED_DIRECT) {
		if (json[name] && typeof json[name] === "object" && !Array.isArray(json[name])) {
			json[name] = processSchema(visitor, json[name], context);
		}
	}

	for (const name of NESTED_ARRAY) {
		if (Array.isArray(json[name])) {
			json[name] = json[name].map((item) => processSchema(visitor, item, context));
			if (typeof visitor?.array === "function") {
				visitor.array(json[name], context);
			}
		}
	}

	return json;
};

module.exports = processSchema;
