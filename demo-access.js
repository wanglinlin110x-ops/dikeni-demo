/* Local demo identity only. Production must enforce the same rules on the server. */
window.DemoAccess = (() => {
  const viewer = window.DemoViewer || { role: 'general_manager', employeeFields: ['hometown', 'joinedAt'], regions: ['*'] };
  const fields = new Set(Array.isArray(viewer.employeeFields) ? viewer.employeeFields : []);
  const regions = Array.isArray(viewer.regions) ? [...viewer.regions] : [];
  const privileged = ['general_manager', 'hr_manager'].includes(viewer.role);
  const knowledgeScopes = Array.isArray(viewer.knowledgeScopes) ? [...viewer.knowledgeScopes] : ['general_manager', 'hr_manager', 'sales_manager', 'sales_advisor'].includes(viewer.role) ? ['sales'] : [];
  const scopeParts = [viewer.role || 'guest', [...fields].sort(), [...regions].sort()];
  if (Array.isArray(viewer.knowledgeScopes)) scopeParts.push([...knowledgeScopes].sort());
  return Object.freeze({
    storageScope: encodeURIComponent(JSON.stringify(scopeParts)),
    canReadKnowledge(audience) { return knowledgeScopes.includes('*') || knowledgeScopes.includes(audience); },
    canReadEmployee(field, person) {
      return privileged && fields.has(field) && Boolean(person) && (regions.includes('*') || regions.includes(person.region));
    },
  });
})();
