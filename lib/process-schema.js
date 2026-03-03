/**
 * Keys that contain nested objects with named children (e.g., definitions, properties).
 * @type {string[]}
 */
const NESTED_WITH_NAME = ["definitions", "properties"];

/**
 * Keys that contain directly nested schema objects (e.g., items, additionalProperties, not).
 * @type {string[]}
 */
const NESTED_DIRECT = ["items", "additionalProperties", "not"];

/**
 * Keys that contain arrays of schema objects (e.g., oneOf, anyOf, allOf).
 * @type {string[]}
 */
const NESTED_ARRAY = ["oneOf", "anyOf", "allOf"];

/**
 * Recursively processes a JSON Schema using the visitor pattern.
 *
 * @param {{
 *   schema?: (schema: Record<string, any>, context?: Record<string, any>) => Record<string, any> | void,
 *   object?: (obj: Record<string, any>, context?: Record<string, any>) => Record<string, any> | void,
 *   array?: (collection: any[], context?: Record<string, any>) => void
 * }} visitor - Visitor object with optional handlers for schema, object, and array nodes.
 * @param {Record<string, any>} json - The JSON Schema node to process.
 * @param {Record<string, any>} [context] - Optional shared context passed through recursive calls.
 * @returns {Record<string, any>} - The processed schema node.
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
