// utils/diff.js

const IGNORED_FIELDS = ['updatedAt', 'createdAt', '__v'];

export const getChangedFields = (oldData = {}, newData = {}) => {
  const changes = {};

  for (const key of Object.keys(newData)) {
    if (IGNORED_FIELDS.includes(key)) continue;

    const oldVal = oldData[key];
    const newVal = newData[key];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[key] = {
        from: oldVal,
        to: newVal,
      };
    }
  }

  return changes;
};