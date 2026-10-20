// 持久化工具：Pinia 本身不提供持久化能力，页面刷新后 state 会重置为初始值。
// 这里把「读」与「写」两个动作抽成通用函数，供各 Store 在 state 初始化与 actions 中调用。
//
// 约定：每个 Store 使用一个独立的 key，保存的都是 JSON 字符串。
// 读取失败（内容被手动改坏、非 JSON、被清空）时统一返回 fallback，
// 保证任何情况下页面都还能渲染出内容，而不是整体白屏。

export const STORAGE_PREFIX = 'exp4:'

/** 拼接带命名空间的 storage key，避免与实验三遗留数据混淆 */
export function storageKey(name) {
  return `${STORAGE_PREFIX}${name}`
}

/**
 * 从 localStorage 读取并反序列化。
 * @param {string} name 不含前缀的存储名
 * @param {*} fallback 读取失败或不存在时返回的兜底值
 */
export function readStorage(name, fallback) {
  try {
    const raw = localStorage.getItem(storageKey(name))
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    return parsed === null || parsed === undefined ? fallback : parsed
  } catch {
    // JSON 解析失败：说明本地数据已损坏，直接退回兜底值
    return fallback
  }
}

/** 序列化写入 localStorage，写入失败（隐私模式 / 配额满）时静默忽略 */
export function writeStorage(name, value) {
  try {
    localStorage.setItem(storageKey(name), JSON.stringify(value))
  } catch {
    /* 存储不可用时只影响持久化，不影响本次会话内的响应式状态 */
  }
}

/** 删除某个存储项，用于「恢复默认」这类重置操作 */
export function removeStorage(name) {
  try {
    localStorage.removeItem(storageKey(name))
  } catch {
    /* 同上 */
  }
}

/**
 * 读取对象并按字段做合并：本地只存了部分字段时，其余字段用默认值补齐。
 * 新增字段后旧数据依然可用，不必强制用户清理浏览器缓存。
 */
export function readObjectStorage(name, defaults) {
  const saved = readStorage(name, null)
  return saved && typeof saved === 'object' && !Array.isArray(saved)
    ? { ...defaults, ...saved }
    : { ...defaults }
}
