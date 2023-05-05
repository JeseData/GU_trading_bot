export function getEnv(name, defaultValue = undefined) {
    const value = process.env[name];
    if (value !== undefined) {
        return value;
    }
    if (defaultValue !== undefined) {
        return defaultValue;
    }
    throw new Error(`Environment variable '${name}' not set`);
}
export function requireEnvironmentVariable(key) {
    const value = getEnv(key);
    if (!value) {
        throw new Error(`Please ensure a value exists for ${key}`);
    }
    return value;
}
