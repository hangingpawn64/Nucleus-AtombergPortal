/**
 * Shared shape references for JavaScript projects.
 *
 * @typedef {Object} PortalUser
 * @property {string} id
 * @property {string} email
 * @property {"admin" | "member"} role
 * @property {"active" | "pending" | "disabled"} status
 *
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} user_id
 * @property {string} title
 * @property {string=} body
 * @property {string=} read_at
 *
 * @typedef {Object} ActivityLog
 * @property {string} id
 * @property {string} action
 * @property {string=} actor_id
 * @property {Object=} metadata
 */

export {};
