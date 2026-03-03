/**
 * @typedef {Object} JSONSchema
 * @property {string} [$id]
 * @property {string} [$schema]
 * @property {string} [$ref]
 * @property {string} [title]
 * @property {string} [description]
 * @property {string | string[]} [type]
 * @property {boolean} [nullable]
 * @property {JSONSchema | boolean} [items]
 * @property {Record<string, JSONSchema | boolean>} [properties]
 * @property {JSONSchema | boolean} [additionalProperties]
 * @property {JSONSchema[]} [oneOf]
 * @property {JSONSchema[]} [anyOf]
 * @property {JSONSchema[]} [allOf]
 * @property {Record<string, JSONSchema | boolean>} [definitions]
 * @property {unknown} [enum]
 * @property {unknown} [const]
 * @property {unknown} [default]
 * @property {Record<string, unknown>} [examples]
 * @property {Record<string, unknown>} [other] - Any additional schema fields.
 */

/**
 * @typedef {Object} ProcessContext
 * @property {JSONSchema} [rootSchema] - The root schema being processed.
 * @property {string[]} [path] - Path segments from the root to the current node.
 * @property {Record<string, unknown>} [meta] - Arbitrary metadata shared across recursion.
 */

/**
 * @typedef {Object} SchemaVisitor
 * @property {(schema: JSONSchema | boolean, context?: ProcessContext) => JSONSchema | boolean | void} [schema]
 * @property {(obj: JSONSchema | boolean, context?: ProcessContext) => JSONSchema | boolean | void} [object]
 * @property {(arr: (JSONSchema | boolean)[], context?: ProcessContext) => void} [array]
 */

// Constants defining nested schema traversal structure
const NESTED_WITH_NAME = ["definitions", "properties"];
const NESTED_DIRECT = ["items", "additionalProperties", "not"];
const NESTED_ARRAY = ["oneOf", "anyOf", "allOf"];

/**
 * Recursively processes a JSON Schema using the visitor pattern.
 *
 * @param {SchemaVisitor} visitor - Visitor functions to apply.
 * @param {JSONSchema | boolean} json - JSON Schema to process.
 * @param {ProcessContext} [context] - Optional shared context passed through recursion.
 * @returns {JSONSchema | boolean} - The processed JSON Schema.
 */
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
