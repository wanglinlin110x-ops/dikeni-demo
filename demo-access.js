/* Local demo identity only. Production must enforce the same rules on the server. */
window.DemoAccess = (() => {
  const viewer = window.DemoViewer || { role: 'general_manager', employeeFields: ['hometown', 'joinedAt'], regions: ['*'] };
  const fields = new Set(Array.isArray(viewer.employeeFields) ? viewer.employeeFields : []);
  const regions = Array.isArray(viewer.regions) ? [...viewer.regions] : [];
  const privileged = ['general_manager', 'hr_manager'].includes(viewer.role);
  return Object.freeze({
    storageScope: encodeURIComponent(JSON.stringify([viewer.role || 'guest', [...fields].sort(), [...regions].sort()])),
    canReadEmployee(field, person) {
      return privileged && fields.has(field) && Boolean(person) && (regions.includes('*') || regions.includes(person.region));
    },
  });
})();
