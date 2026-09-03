export const PERMISSIONS = {
  USER_VIEW: "user.view",
  USER_CREATE: "user.create",
  USER_UPDATE: "user.update",
  USER_DELETE: "user.delete",
  ROLE_VIEW: "role.view",
  ROLE_CREATE: "role.create",
  ROLE_UPDATE: "role.update",
  ROLE_DELETE: "role.delete",
  REPORT_VIEW_ALL: "report.view.all",
  REPORT_CREATE: "report.create",
  REPORT_EDIT: "report.edit",
  REPORT_SUBMIT: "report.submit",
  REPORT_APPROVE: "report.approve",
  PROJECT_VIEW: "project.view",
  PROJECT_MANAGE: "project.manage",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const SEED_PERMISSIONS: { key: string; name: string; module: string; description: string }[] = [
  { key: PERMISSIONS.USER_VIEW, name: "View Users", module: "Users", description: "Can view the user list" },
  { key: PERMISSIONS.USER_CREATE, name: "Create Users", module: "Users", description: "Can create new users" },
  { key: PERMISSIONS.USER_UPDATE, name: "Update Users", module: "Users", description: "Can update user details and roles" },
  { key: PERMISSIONS.USER_DELETE, name: "Delete Users", module: "Users", description: "Can delete users" },
  { key: PERMISSIONS.ROLE_VIEW, name: "View Roles", module: "Roles", description: "Can view roles and permissions" },
  { key: PERMISSIONS.ROLE_CREATE, name: "Create Roles", module: "Roles", description: "Can create roles" },
  { key: PERMISSIONS.ROLE_UPDATE, name: "Update Roles", module: "Roles", description: "Can update role permissions" },
  { key: PERMISSIONS.ROLE_DELETE, name: "Delete Roles", module: "Roles", description: "Can delete roles" },
  { key: PERMISSIONS.REPORT_VIEW_ALL, name: "View All Reports", module: "Reports", description: "Can view reports across all members" },
  { key: PERMISSIONS.REPORT_CREATE, name: "Create Reports", module: "Reports", description: "Can create own weekly reports" },
  { key: PERMISSIONS.REPORT_EDIT, name: "Edit Reports", module: "Reports", description: "Can edit own weekly reports" },
  { key: PERMISSIONS.REPORT_SUBMIT, name: "Submit Reports", module: "Reports", description: "Can submit own weekly reports" },
  { key: PERMISSIONS.REPORT_APPROVE, name: "Approve Reports", module: "Reports", description: "Can review and approve reports" },
  { key: PERMISSIONS.PROJECT_VIEW, name: "View Projects", module: "Projects", description: "Can view projects" },
  { key: PERMISSIONS.PROJECT_MANAGE, name: "Manage Projects", module: "Projects", description: "Can create and manage projects" },
];

export const SEED_ROLES: {
  key: string;
  name: string;
  description: string;
  permissionKeys: string[];
}[] = [
  {
    key: "team-member",
    name: "Team Member",
    description: "Can create, edit and submit their own weekly reports.",
    permissionKeys: [
      PERMISSIONS.REPORT_CREATE,
      PERMISSIONS.REPORT_EDIT,
      PERMISSIONS.REPORT_SUBMIT,
      PERMISSIONS.PROJECT_VIEW,
    ],
  },
  {
    key: "manager",
    name: "Manager",
    description: "Can view and analyze reports across all members, and review/approve submissions.",
    permissionKeys: [
      PERMISSIONS.REPORT_VIEW_ALL,
      PERMISSIONS.REPORT_APPROVE,
      PERMISSIONS.REPORT_CREATE,
      PERMISSIONS.REPORT_EDIT,
      PERMISSIONS.REPORT_SUBMIT,
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.ROLE_VIEW,
      PERMISSIONS.PROJECT_VIEW,
      PERMISSIONS.PROJECT_MANAGE,
    ],
  },
  {
    key: "admin",
    name: "Admin",
    description: "Full access to the entire workspace including user, role and permission management.",
    permissionKeys: SEED_PERMISSIONS.map((p) => p.key),
  },
];
